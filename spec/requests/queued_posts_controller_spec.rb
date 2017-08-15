require 'rails_helper'
require_dependency 'queued_posts_controller'
require_dependency 'queued_post'

describe QueuedPostsController do
  context 'without authentication' do
    it 'fails' do
      get "/queued-posts.json"
      expect(response).to be_forbidden
    end
  end

  context 'as a regular user' do
    before { sign_in(Fabricate(:user)) }

    it 'fails' do
      get "/queued-posts.json"
      expect(response).to be_forbidden
    end
  end

  context 'as an admin' do
    before { sign_in(Fabricate(:moderator)) }

    it 'returns the queued posts' do
      get "/queued-posts.json"
      expect(response.status).to eq(200)
    end
  end

  describe '#update' do
    let(:moderator) { Fabricate(:moderator) }
    let(:qp) { Fabricate(:queued_post) }
    before { sign_in(moderator) }

    context 'not found' do
      it 'returns json error' do
        qp.destroy!

        put "/queued_posts/#{qp.id}.json", params: {
          queued_post: { state: 'approved' }
        }

        expect(response.status).to eq(422)

        expect(JSON.parse(response.body)["errors"].first).to eq(I18n.t('queue.not_found'))
      end
    end

    context 'approved' do
      it 'updates the post to approved' do

        put "/queued_posts/#{qp.id}.json", params: {
          queued_post: { state: 'approved' }
        }

        expect(response.status).to eq(200)

        qp.reload
        expect(qp.state).to eq(QueuedPost.states[:approved])
      end
    end

    context 'rejected' do
      it 'updates the post to rejected' do

        put "/queued_posts/#{qp.id}.json", params: {
          queued_post: { state: 'rejected' }
        }

        expect(response.status).to eq(200)

        qp.reload
        expect(qp.state).to eq(QueuedPost.states[:rejected])
      end
    end

    context 'editing content' do
      let(:changes) do
        {
          raw: 'new raw',
          title: 'new title',
          category_id: 10,
          tags: ['new_tag'],
          edit_reason: 'keep everything up to date'
        }
      end

      context 'when it is a topic' do
        let(:queued_topic) { Fabricate(:queued_topic) }
        let!(:original_topic) { queued_topic.dup }

        before do
          put "/queued_posts/#{queued_topic.id}.json", params: {
            queued_post: changes
          }

          queued_topic.reload
        end

        it { expect(response.status).to eq(200) }

        it 'removes tags if not present' do
          queued_topic.post_options[:tags] = ['another-tag']
          queued_topic.save!

          put "/queued_posts/#{queued_topic.id}.json", params: {
            queued_post: changes.except(:tags)
          }
          expect(response.status).to eq(200)

          queued_topic.reload
          expect(queued_topic.post_options['changes']['tags']).to be_nil
        end

        it 'save the changes to post_options[:changes]' do
          expect(queued_topic.post_options['changes']['raw']).to eq(changes[:raw])
          expect(queued_topic.post_options['changes']['title']).to eq(changes[:title])
          expect(queued_topic.post_options['changes']['category_id']).to eq(changes[:category_id])
          expect(queued_topic.post_options['changes']['tags']).to eq(changes[:tags])
        end

        it 'does not affect the original post data' do
          expect(queued_topic.raw).to eq(original_topic.raw)
          expect(queued_topic.post_options['title']).to eq(original_topic.post_options['title'])
          expect(queued_topic.post_options['category']).to eq(original_topic.post_options['category'])
          expect(queued_topic.post_options['tags']).to eq(original_topic.post_options['tags'])
        end

        it 'records editor_id and edit_reason' do
          expect(queued_topic.post_options['changes']['editor_id']).to eq(moderator.id)
          expect(queued_topic.post_options['changes']['edit_reason']).to eq(changes[:edit_reason])
        end
      end

      context 'when it is a reply' do
        let(:queued_reply) { Fabricate(:queued_post) }
        let!(:original_reply) { queued_reply.dup }

        before do
          put "/queued_posts/#{queued_reply.id}.json", params: {
            queued_post: changes
          }

          queued_reply.reload
        end

        it { expect(response.status).to eq(200) }

        it 'save the changes to post_options[:changes]' do
          expect(queued_reply.post_options['changes']['raw']).to eq(changes[:raw])
          expect(queued_reply.post_options['changes']['title']).to be_nil, "title cannot be edited for a reply"
          expect(queued_reply.post_options['changes']['category_id']).to be_nil, "category cannot be edited for a reply"
          expect(queued_reply.post_options['changes']['tags']).to be_nil, "tags cannot be edited for a reply"
        end

        it 'does not affect the original post data' do
          expect(queued_reply.raw).to eq(original_reply.raw)
          expect(queued_reply.post_options['title']).to eq(original_reply.post_options['title'])
          expect(queued_reply.post_options['category']).to eq(original_reply.post_options['category'])
          expect(queued_reply.post_options['tags']).to eq(original_reply.post_options['tags'])
        end

        it 'records editor_id and edit_reason' do
          expect(queued_reply.post_options['changes']['editor_id']).to eq(moderator.id)
          expect(queued_reply.post_options['changes']['edit_reason']).to eq(changes[:edit_reason])
        end
      end
    end
  end
end
