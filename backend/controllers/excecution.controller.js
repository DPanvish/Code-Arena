import { codeSubmissionQueue } from '../config/queue.js';

export const submitCode = async (req, res) => {
  const { code, language, problemId, userId } = req.body;

  if (!code || !language || !problemId) {
    return res.status(400).json({ error: 'Missing mandatory execution fields.' });
  }

  try {
    // Enqueue the heavy workload into Redis and return immediately
    const job = await codeSubmissionQueue.add(`submit_${userId}_${problemId}`, {
      code,
      language,
      problemId,
      userId
    });

    // 202 Accepted implies the processing has started but is not finished
    return res.status(202).json({
      success: true,
      message: 'Submission enqueued safely.',
      jobId: job.id
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to queue the submission safely.' });
  }
};