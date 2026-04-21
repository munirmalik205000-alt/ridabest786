import { db } from "./firebase";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const snap = await db.collection("users").get();
    const data = snap.docs.map(doc => doc.data());
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    await db.collection("users").add({ name: "Munir" });
    return res.status(201).json({ success: true });
  }
}
