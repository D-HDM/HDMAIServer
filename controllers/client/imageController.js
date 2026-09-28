const axios = require('axios');
const config = require('../../config');
const usageService = require('../../services/usageService');

const generate = async (req, res, next) => {
  try {
    const { prompt, style, size, num_images, mode, image_base64 } = req.body;
    const userId = req.user.sub;

    const response = await axios.post(
      `${config.pythonAiUrl}/v1/image`,
      {
        user_id: userId,
        prompt,
        style: style || 'realistic',
        size: size || '1024x1024',
        num_images: num_images || 1,
        mode: mode || 'generate',
        image_base64,
      },
      { timeout: 60000 }
    );

    const body = response.data?.data || response.data;

    await usageService.log({
      userId,
      module: 'chat',
      provider: 'HDM AI',
      endpoint: '/image',
      model: 'HDM Nova',
      tokensUsed: body.tokens_used || 0,
      status: 'success',
    });

    res.json({ success: true, data: body });
  } catch (err) {
    console.error('Image failed:', err.message);
    res.status(500).json({ success: false, error: 'Image engine unavailable.' });
  }
};

module.exports = { generate };