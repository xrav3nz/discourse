import { acceptance } from "helpers/qunit-helpers";

acceptance("Queued Posts", {
  loggedIn: true,
  settings: { tagging_enabled: true },
  pretend(server, helper) {
    server.get("/queued_posts", () => {
      return helper.response({
        users: [
          {
            id: 3,
            username: "test_user",
            avatar_template:
              "/letter_avatar_proxy/v2/letter/t/eada6e/{size}.png",
            active: true,
            admin: false,
            moderator: false,
            last_seen_at: "2017-08-11T20:48:05.405Z",
            last_emailed_at: null,
            created_at: "2017-08-07T02:23:33.309Z",
            last_seen_age: "1d",
            last_emailed_age: null,
            created_at_age: "6d",
            username_lower: "test_user",
            trust_level: 0,
            trust_level_locked: false,
            flag_level: 0,
            title: null,
            suspended_at: null,
            suspended_till: null,
            suspended: null,
            silenced: false,
            time_read: "19m",
            staged: false,
            days_visited: 4,
            posts_read_count: 12,
            topics_entered: 6,
            post_count: 2
          }
        ],
        queued_posts: [
          {
            id: 22,
            queue: "default",
            user_id: 3,
            state: 1,
            topic_id: null,
            approved_by_id: null,
            rejected_by_id: null,
            raw: "some content",
            post_options: {
              archetype: "regular",
              category: "1",
              typing_duration_msecs: "3200",
              composer_open_duration_msecs: "19007",
              visible: true,
              is_warning: false,
              title: "a new topic that needs to be reviewed",
              ip_address: "172.17.0.1",
              first_post_checks: true,
              is_poll: true
            },
            created_at: "2017-08-11T20:43:41.115Z",
            category_id: 1,
            can_delete_user: true
          }
        ],
        __rest_serializer: "1",
        refresh_queued_posts: "/queued_posts?status=new"
      });
    });
  }
});

QUnit.test(
  "For topics: body of post, title, category and tags are all editable",
  async assert => {
    await visit("/queued-posts");
    await click(".queued-posts .queued-post button.edit");

    assert.ok(exists(".d-editor-container"), "the body should be editable");
    assert.ok(
      exists(".edit-title .ember-text-field"),
      "the title should be editable"
    );
    assert.ok(exists(".category-chooser"), "category should be editable");
    assert.ok(exists(".tag-chooser"), "tags should be editable");
  }
);

QUnit.test("For replies: only the body of post is editable", async assert => {
  // prettier-ignore
  server.get("/queued_posts", () => { //eslint-disable-line no-undef
    return [
      200,
      { "Content-Type": "application/json" },
      {
        users: [
          {
            id: 3,
            username: "test_user",
            avatar_template:
              "/letter_avatar_proxy/v2/letter/t/eada6e/{size}.png",
            active: true,
            admin: false,
            moderator: false,
            last_seen_at: "2017-08-11T20:48:05.405Z",
            last_emailed_at: null,
            created_at: "2017-08-07T02:23:33.309Z",
            last_seen_age: "1d",
            last_emailed_age: null,
            created_at_age: "6d",
            username_lower: "test_user",
            trust_level: 0,
            trust_level_locked: false,
            flag_level: 0,
            title: null,
            suspended_at: null,
            suspended_till: null,
            suspended: null,
            silenced: false,
            time_read: "19m",
            staged: false,
            days_visited: 4,
            posts_read_count: 12,
            topics_entered: 6,
            post_count: 2
          }
        ],
        topics: [
          {
            id: 11,
            title: "This is a topic",
            fancy_title: "This is a topic",
            slug: "this-is-a-topic",
            posts_count: 2
          }
        ],
        queued_posts: [
          {
            id: 4,
            queue: "default",
            user_id: 3,
            state: 1,
            topic_id: 11,
            approved_by_id: null,
            rejected_by_id: null,
            raw: "edited haahaasdfasdfasdfasdf",
            post_options: {
              archetype: "regular",
              category: "3",
              reply_to_post_number: "2",
              typing_duration_msecs: "1900",
              composer_open_duration_msecs: "12096",
              visible: true,
              is_warning: false,
              featured_link: "",
              ip_address: "172.17.0.1",
              first_post_checks: true,
              is_poll: true
            },
            created_at: "2017-08-07T19:11:52.018Z",
            category_id: 3,
            can_delete_user: true
          }
        ],
        __rest_serializer: "1",
        refresh_queued_posts: "/queued_posts?status=new"
      }
    ];
  });

  await visit("/queued-posts");
  await click(".queued-posts .queued-post button.edit");

  assert.ok(exists(".d-editor-container"), "the body should be editable");
  assert.notOk(
    exists(".edit-title .ember-text-field"),
    "title should not be editbale"
  );
  assert.notOk(exists(".category-chooser"), "category should not be editable");
  assert.notOk(exists("div.tag-chooser"), "tags should not be editable");
});

QUnit.test("revised content should be shown if provided", assert => {
  // prettier-ignore
  server.get("/queued_posts", () => { //eslint-disable-line no-undef
    return [
      200,
      {"Content-Type": "application/json"},
      {"users":[{"id":3,"username":"test_user","avatar_template":"/letter_avatar_proxy/v2/letter/t/eada6e/{size}.png","active":true,"admin":false,"moderator":false,"last_seen_at":"2017-08-15T19:11:58.078Z","last_emailed_at":null,"created_at":"2017-08-07T02:23:33.309Z","last_seen_age":"1m","last_emailed_age":null,"created_at_age":"9d","username_lower":"test_user","trust_level":0,"trust_level_locked":false,"flag_level":0,"title":null,"suspended_at":null,"suspended_till":null,"suspended":null,"blocked":false,"time_read":"33m","staged":false,"days_visited":5,"posts_read_count":26,"topics_entered":8,"post_count":14}],"topics":[],"queued_posts":[{"id":37,"queue":"default","user_id":3,"state":1,"topic_id":null,"approved_by_id":null,"rejected_by_id":null,"raw":"original content","post_options":{"archetype":"regular","category":"17","typing_duration_msecs":"3000","composer_open_duration_msecs":"18425","visible":true,"is_warning":false,"title":"original title","tags":["original"],"first_post_checks":true,"is_poll":true,"changes":{"raw":"new content","title":"new title","category_id":3,"tags":["edited"],"editor_id":1}},"created_at":"2017-08-15T19:12:24.310Z","category_id":1,"can_delete_user":true,"revised":true}],"__rest_serializer":"1","refresh_queued_posts":"/queued_posts?status=new"}
    ];
  });

  visit("/queued-posts");

  andThen(() => {
    assert.ok(
      exists(".body:contains('new content')"),
      "the revised body of the post should be shown"
    );
    assert.ok(
      exists(".post-title:contains('new title')"),
      "the revised title should be shown"
    );
    assert.ok(
      exists(".badge-category:contains('meta')"),
      "the revised category should be shown"
    );
    assert.ok(
      exists(".tag-edited:contains('edited')"),
      "the revised tag should be shown"
    );
  });
});
