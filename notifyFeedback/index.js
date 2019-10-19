const { IncomingWebhook } = require('@slack/webhook');

const notifyFeedback = async (snap, context) => {
  const feedbackWebhook = new IncomingWebhook(process.env.FEEDBACK_WEBHOOK_URL);

  await feedbackWebhook.send({
    text: 'ユーザーからのフィードバックがあったよ！'
  });
};

module.exports = notifyFeedback;
