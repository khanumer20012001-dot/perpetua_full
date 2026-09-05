import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import * as geminiService from '../services/gemini';

export const geminiRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/',
    {
      schema: {
        body: z.object({
          action: z.enum(['generate', 'refine', 'analyze', 'discovery', 'draft']),
          prompt: z.string().optional(),
          content: z.string().optional(),
          feedback: z.string().optional(),
          material: z.string().optional(),
          brief: z.string().optional(),
        })
      }
    },
    async (request, reply) => {
      const { action, prompt, content, feedback, material, brief } = request.body;
      let result = "";

      try {
        switch (action) {
          case "generate":
            if (!prompt) return reply.status(400).send({ error: "prompt is required" });
            result = await geminiService.generateCourseContent(prompt);
            break;
          case "refine":
            if (!content || !feedback) return reply.status(400).send({ error: "content and feedback are required" });
            result = await geminiService.refineCourseContent(content, feedback);
            break;
          case "analyze":
            if (!material) return reply.status(400).send({ error: "material is required" });
            result = await geminiService.analyzeSourceMaterial(material);
            break;
          case "discovery":
            if (!brief) return reply.status(400).send({ error: "brief is required" });
            result = await geminiService.generateDiscoveryQuestions(brief);
            break;
          case "draft":
            if (!brief) return reply.status(400).send({ error: "brief is required" });
            result = await geminiService.generateCourseDraft(brief);
            break;
        }

        return { content: result };
      } catch (error: any) {
        console.error("Gemini Error:", error);
        return reply.status(500).send({ error: error.message });
      }
    }
  );
};
