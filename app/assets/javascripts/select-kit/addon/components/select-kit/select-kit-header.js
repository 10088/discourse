import Component from "@ember/component";
import UtilsMixin from "select-kit/mixins/utils";
import { computed } from "@ember/object";
import { makeArray } from "discourse-common/lib/helpers";

export default Component.extend(UtilsMixin, {
  classNames: ["select-kit-header"],
  classNameBindings: ["isFocused"],
  attributeBindings: [
    "role",
    "tabindex",
    "ariaLevel:aria-level",
    "selectedValue:data-value",
    "selectedNames:data-name",
    "buttonTitle:title",
    "selectKit.options.autofocus:autofocus",
  ],

  selectKit: null,

  role: "button",

  ariaLevel: 1,

  tabindex: 0,

  selectedValue: computed("value", function () {
    return this.value === this.getValue(this.selectKit.noneItem)
      ? null
      : makeArray(this.value).join(",");
  }),

  selectedNames: computed("selectedContent.[]", function () {
    return makeArray(this.selectedContent)
      .map((s) => this.getName(s))
      .join(",");
  }),

  buttonTitle: computed("value", "selectKit.noneItem", function () {
    if (
      !this.value &&
      this.selectKit.noneItem &&
      !this.selectKit.options.showFullTitle
    ) {
      return this.selectKit.noneItem.title || this.selectKit.noneItem.name;
    }
  }),

  icons: computed("selectKit.options.{icon,icons}", function () {
    const icon = makeArray(this.selectKit.options.icon);
    const icons = makeArray(this.selectKit.options.icons);
    return icon.concat(icons).filter(Boolean);
  }),

  didInsertElement() {
    this._super(...arguments);
    if (this.selectKit.options.autofocus) {
      this.set("isFocused", true);
    }
  },

  click(event) {
    event.stopImmediatePropagation();
  },

  keyUp(event) {
    if (event.key === " ") {
      event.preventDefault();
    }
  },

  keyDown(event) {
    if (this.selectKit.isDisabled) {
      return;
    }

    if (!this.selectKit.onKeydown(event)) {
      return false;
    }

    const onlyShiftKey = event.shiftKey && event.key === "Shift";
    if (event.metaKey || onlyShiftKey) {
      return;
    }

    if (event.key === "Enter") {
      event.stopPropagation();

      if (this.selectKit.isExpanded) {
        if (this.selectKit.highlighted) {
          this.selectKit.select(
            this.getValue(this.selectKit.highlighted),
            this.selectKit.highlighted
          );
          return false;
        }
      } else {
        this.selectKit.mainElement().open = false;
      }
    } else if (event.key === "ArrowUp") {
      event.stopPropagation();

      if (this.selectKit.isExpanded) {
        this.selectKit.highlightPrevious();
      } else {
        this.selectKit.mainElement().open = true;
      }
      return false;
    } else if (event.key === "ArrowDown") {
      event.stopPropagation();
      if (this.selectKit.isExpanded) {
        this.selectKit.highlightNext();
      } else {
        this.selectKit.mainElement().open = true;
      }
      return false;
    } else if (event.key === " ") {
      event.stopPropagation();
      event.preventDefault(); // prevents the space to trigger a scroll page-next
      this.selectKit.mainElement().open = true;
    } else if (event.key === "Escape") {
      event.stopPropagation();
      if (this.selectKit.isExpanded) {
        this.selectKit.mainElement().open = false;
      } else {
        this.element.blur();
      }
    } else if (event.key === "Tab") {
      return true;
    } else if (event.key === "Backspace") {
      this._focusFilterInput();
    } else if (
      this.selectKit.options.filterable ||
      this.selectKit.options.autoFilterable ||
      this.selectKit.options.allowAny
    ) {
      if (this.selectKit.isExpanded) {
        this._focusFilterInput();
      } else {
        // relying on passing the event to the input is risky as it could not work
        // dispatching the event won't work as the event won't be trusted
        // safest solution is to filter event and prefill filter with it
        const nonInputKeysRegex = /F\d+|Arrow.+|Alt|Control/;
        if (!nonInputKeysRegex.test(event.key)) {
          this.selectKit.set("filter", event.key);
          this.selectKit.mainElement().open = true;
          event.preventDefault();
          event.stopPropagation();
        }
      }
    } else {
      if (this.selectKit.isExpanded) {
        return false;
      } else {
        return true;
      }
    }
  },

  _focusFilterInput() {
    const filterContainer = document.querySelector(
      `#${this.selectKit.uniqueID}-filter`
    );

    if (filterContainer) {
      filterContainer.style.display = "flex";

      const filterInput = filterContainer.querySelector(".filter-input");
      filterInput && filterInput.focus();
    }
  },
});
