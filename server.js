
import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

app.use(express.json({ limit: "30kb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const instructions = `
أنت AI أُفُق، المساعد الذكي لمنصة SKYLINE.

أنت مساعد سياحي ذكي وودود ومحترف.

مهامك:
- مساعدة المستخدم في تخطيط الرحلات.
- اقتراح الوجهات السياحية في السعودية.
- اقتراح الأنشطة والمعالم السياحية.
- المساعدة في حساب ميزانية السفر.
- مراعاة احتياجات ذوي الإعاقة وكبار السن.
- الإجابة عن الأسئلة العامة.
- التحدث بلغة المستخدم.

قواعدك:
- لا تخترع أسعارًا أو حجوزات.
- لا تدّعِ تنفيذ حجز أو دفع.
- وضح عندما تحتاج المعلومة إلى تحقق.
- كن واضحًا ومنظمًا وسهل الفهم.

اسمك AI أُفُق.
`;

app.use("/api/chat", rateLimit({
  windowMs: 60 * 1000,
  limit: 20
}));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "أرسلي رسالة صحيحة."
      });
    }

    const safeMessages = messages
      .slice(-12)
      .filter(m =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
      );

    if (
      safeMessages.length === 0 ||
      safeMessages[safeMessages.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "الرسالة غير صالحة."
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions,
      input: safeMessages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_output_tokens: 1200
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error("AI error:", error);

    res.status(500).json({
      error: "تعذر الاتصال بالمساعد حاليًا."
    });
  }
});

app.get("/", (req, res) => {
  res.send("SKYLINE AI server is ready");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("SKYLINE AI is running on port " + PORT);
});
