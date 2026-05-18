const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const addGameSchema = z.object({
  steam_id: z.string().min(1),
  name: z.string().min(1),
  playtime_hours: z.number().int().min(0).default(0),
  playtime_minutes: z.number().int().min(0).max(59).default(0),
  achievement_count: z.number().int().min(0).default(0),
  total_achievements: z.number().int().min(0).default(0),
  image_url: z.string().optional().default(''),
  is_steam_playtime: z.union([z.boolean(), z.number()]).optional().default(false),
});

const updatePlaytimeSchema = z.object({
  playtime_hours: z.number().int().min(0),
  playtime_minutes: z.number().int().min(0).max(59),
});

const bulkDeleteSchema = z.object({
  steam_ids: z.array(z.string().min(1)).min(1),
});

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    steam_id: z.string().min(1),
    playtime_hours: z.number().int().min(0),
    playtime_minutes: z.number().int().min(0).max(59),
  })).min(1),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate, loginSchema, addGameSchema, updatePlaytimeSchema, bulkDeleteSchema, bulkUpdateSchema };
