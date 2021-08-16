import Component from "@ember/component";
import { bind } from "@ember/runloop";
import { computed } from "@ember/object";
import layout from "select-kit/templates/components/select-kit/select-kit-body";

export default Component.extend({
  layout,
  classNames: ["select-kit-body"],
  classNameBindings: ["emptyBody:empty-body"],
  attributeBindings: ["ariaLive:aria-live"],
  emptyBody: computed("selectKit.{filter,hasNoContent}", function () {
    return false;
  }),
  rootEventType: "click",

  ariaLive: "polite",

  init() {
    this._super(...arguments);

    this.handleRootMouseDownHandler = bind(this, this.handleRootMouseDown);
  },

  didInsertElement() {
    this._super(...arguments);

    this.element.style.position = "relative";

    document.addEventListener(
      this.rootEventType,
      this.handleRootMouseDownHandler,
      true
    );
  },

  willDestroyElement() {
    this._super(...arguments);

    document.removeEventListener(
      this.rootEventType,
      this.handleRootMouseDownHandler,
      true
    );
  },

  handleRootMouseDown(event) {
    if (!this.selectKit.isExpanded) {
      return;
    }

    const headerElement = document.querySelector(
      `#${this.selectKit.uniqueID}-header`
    );

    if (headerElement && headerElement.contains(event.target)) {
      return;
    }

    if (this.element.contains(event.target)) {
      return;
    }

    if (this.selectKit.mainElement()) {
      this.selectKit.mainElement().open = false;
    }
  },
});
