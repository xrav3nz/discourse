import { h } from "virtual-dom";
import DiscourseURL from "discourse/lib/url";
import QuickAccessPanel from "discourse/widgets/quick-access-panel";
import { createWidget, createWidgetFrom } from "discourse/widgets/widget";
import { iconNode } from "discourse-common/lib/icon-library";
import { postUrl } from "discourse/lib/utilities";

createWidget("quick-access-message-item", {
  tagName: "li",

  buildClasses({ unseen }) {
    return unseen ? "" : "read";
  },

  html({ href, topicId, fancyTitle }) {
    const content = h(
      "span",
      { attributes: { "data-topic-id": topicId } },
      fancyTitle
    );
    return h("a", { attributes: { href } }, [iconNode("envelope"), content]);
  }
});

let staleItems = [];

createWidgetFrom(QuickAccessPanel, "quick-access-messages", {
  buildKey: () => "quick-access-messages",

  hasMore() {
    // Always show the button to the messages page.
    return true;
  },

  showAll() {
    DiscourseURL.routeTo(`${this.attrs.path}/messages`);
  },

  findStaleItems() {
    return staleItems || [];
  },

  findNewItems() {
    const username = this.currentUser.get("username_lower");
    return this.store
      .findFiltered("topicList", {
        filter: `topics/private-messages/${username}`
      })
      .then(({ topic_list }) => {
        return (staleItems = topic_list.topics);
      });
  },

  itemHtml(message) {
    const href = postUrl(message.slug, message.topic_id, message.post_number);

    return this.attach("quick-access-message-item", {
      href,
      unseen: message.unseen,
      topicId: message.id,
      fancyTitle: message.fancy_title
    });
  }
});
