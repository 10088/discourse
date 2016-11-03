module Onebox
  module Engine
    module StandardEmbed

      def self.oembed_providers
        @@oembed_providers ||= {}
      end

      def self.add_oembed_provider(regexp, endpoint)
        oembed_providers[regexp] = endpoint
      end

      def self.opengraph_providers
        @@opengraph_providers ||= []
      end

      def self.add_opengraph_provider(regexp)
        opengraph_providers << regexp
      end

      # Some oembed providers (like meetup.com) don't provide links to themselves
      add_oembed_provider(/www\.meetup\.com\//, 'http://api.meetup.com/oembed')

      def always_https?
        WhitelistedGenericOnebox.host_matches(uri, WhitelistedGenericOnebox.https_hosts)
      end

      def raw
        return @raw if @raw

        og = get_opengraph
        twitter = get_twitter
        oembed = get_oembed

        @raw = {}

        og.each { |k, v| @raw[k] ||= v unless Onebox::Helpers::blank?(v) }
        twitter.each { |k, v| @raw[k] ||= v unless Onebox::Helpers::blank?(v) }
        oembed.each { |k, v| @raw[k] ||= v unless Onebox::Helpers::blank?(v) }

        @raw
      end

      private

        def html_doc
          return @html_doc if @html_doc
          response = Onebox::Helpers.fetch_response(url)
          @html_doc = Nokogiri::HTML(response.body)
        end

        def get_oembed
          application_json = html_doc.at("//link[@type='application/json+oembed']/@href")
          oembed_url = application_json.value if application_json

          text_json = html_doc.at("//link[@type='text/json+oembed']/@href")
          oembed_url ||= text_json.value if text_json

          if Onebox::Helpers.blank?(oembed_url)
            StandardEmbed.oembed_providers.each do |regexp, endpoint|
              if url[regexp]
                oembed_url = "#{endpoint}?url=#{url}"
                break
              end
            end
          end

          return {} if Onebox::Helpers.blank?(oembed_url)

          Onebox::Helpers.symbolize_keys(::MultiJson.load(Onebox::Helpers.fetch_response(oembed_url).body))
        rescue Errno::ECONNREFUSED, Net::HTTPError, MultiJson::LoadError
          {}
        end

        def get_opengraph
          og = {}

          html_doc.css('meta').each do |m|
            if m["property"] && m["property"][/^og:(.+)$/i]
              value = m["content"].to_s
              og[$1.tr('-:','_').to_sym] ||= value unless Onebox::Helpers::blank?(value)
            end
          end

          og
        end

        def get_twitter
          twitter = {}

          html_doc.css('meta').each do |m|
            if m["name"] && m["name"][/^twitter:(.+)$/i]
              value = (m["content"] || m["value"]).to_s
              twitter[$1.tr('-:','_').to_sym] ||= value unless Onebox::Helpers::blank?(value)
            end
          end

          twitter
        end

    end
  end
end
