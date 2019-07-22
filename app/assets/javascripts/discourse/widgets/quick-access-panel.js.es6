import { createWidget } from "discourse/widgets/widget";
import { headerHeight } from "discourse/components/site-header";
import { h } from "virtual-dom";

export default createWidget("quick-access-panel", {
  tagName: "div.quick-access-panel",
  // buildKey: () =>
  //   throw Error('Cannot attach abstract widget "quick-acess-panel"'),

  markReadRequest() {
    return Ember.RSVP.Promise.resolve();
  },

  hasUnread() {
    return false;
  },

  showAll() {},

  hasMore() {
    return false;
  },

  findStaleItems() {
    return [];
  },

  findNewItems() {
    return Ember.RSVP.Promise.resolve([]);
  },

  newItemsLoaded() {},

  defaultState() {
    return { items: [], loading: false, loaded: false };
  },

  markRead() {
    this.markReadRequest().then(() => {
      this.refreshNotifications(this.state);
    });
  },

  estimateItemLimit() {
    // estimate (poorly) the amount of notifications to return
    let limit = Math.round(($(window).height() - headerHeight()) / 55);
    // we REALLY don't want to be asking for negative counts of notifications
    // less than 5 is also not that useful
    if (limit < 5) {
      limit = 5;
    }
    if (limit > 40) {
      limit = 40;
    }

    return limit;
  },

  refreshNotifications(state) {
    if (this.loading) {
      return;
    }

    const staleItems = this.findStaleItems();

    if (staleItems.length > 0) {
      state.items = staleItems;
    } else {
      state.loading = true;
    }

    this.findNewItems()
      .then(items => {
        this.newItemsLoaded();
        state.items = items;
      })
      .catch(() => {
        state.items = [];
      })
      .finally(() => {
        state.loading = false;
        state.loaded = true;
        this.sendWidgetAction("notificationsLoaded", {
          hasUnread: this.hasUnread(),
          markRead: () => this.markRead()
        });
        this.scheduleRerender();
      });
  },

  html(attrs, state) {
    if (!state.loaded) {
      this.refreshNotifications(state);
    }

    if (state.loading) {
      return [h("div.spinner-container", h("div.spinner"))];
    }

    const result = [];
    if (state.items.length) {
      result.push(h("hr"));

      const notificationItems = state.items.map(
        this.toNotificationItem.bind(this)
      );
      const items = [notificationItems];

      if (this.hasMore()) {
        items.push(
          h(
            "li.read.last.heading.show-all",
            this.attach("button", {
              title: "notifications.more",
              icon: "chevron-down",
              action: "showAll",
              className: "btn"
            })
          )
        );
      }

      result.push(h("ul", items));
    }

    return result;
  }
});
