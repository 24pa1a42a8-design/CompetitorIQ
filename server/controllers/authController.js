import { z } from 'zod';
import { signJwt } from '../utils/authUtils.js';

const tokenRequestSchema = z.object({
  organizationId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/).default('default-org'),
  userId: z.string().min(1).max(64).optional(),
  role: z.enum(['ANALYST', 'ADMIN']).default('ANALYST')
});

export const authController = {
  async issueToken(req, res) {
    try {
      const parsed = tokenRequestSchema.parse(req.body || {});
      const orgId = parsed.organizationId;
      const userId = parsed.userId || `user-${orgId}`;
      const role = parsed.role;

      const token = signJwt({
        id: userId,
        organizationId: orgId,
        role: role
      }, 86400 * 7); // 7 days token

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: userId,
            organizationId: orgId,
            role: role
          },
          expiresInSeconds: 86400 * 7
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid token request payload',
            details: err.errors
          }
        });
      }
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to issue authentication token'
        }
      });
    }
  }
};

export default authController;
