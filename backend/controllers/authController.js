const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateClientCode = () => `CL${Math.random().toString(36).slice(2, 8).toUpperCase()}`; // added by cipherNomad

const generateUniqueClientCode = async () => { // added by cipherNomad
  let clientCode = generateClientCode(); // added by cipherNomad
  let exists = await User.findOne({ clientCode }).select("_id"); // added by cipherNomad
  while (exists) { // added by cipherNomad
    clientCode = generateClientCode(); // added by cipherNomad
    exists = await User.findOne({ clientCode }).select("_id"); // added by cipherNomad
  } // added by cipherNomad
  return clientCode; // added by cipherNomad
}; // added by cipherNomad

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

const ensureClientCodeForUser = async (user) => { // added by cipherNomad
  if (user?.role !== "user") return user; // added by cipherNomad
  if (user?.clientCode) return user; // added by cipherNomad
  user.clientCode = await generateUniqueClientCode(); // added by cipherNomad
  await user.save(); // added by cipherNomad
  return user; // added by cipherNomad
}; // added by cipherNomad

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      token,
      _id: user._id,
      name: user.name,
      email: user.email, // added by cipherNomad
      role: user.role,
      clientCode: user.clientCode || "" // added by cipherNomad
    });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      createdBy: req.body.createdBy, // added by cipherNomad
      clientCode: (role || "user") === "user" ? await generateUniqueClientCode() : undefined // added by cipherNomad
    });

    sendTokenResponse(user, 201, res);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Use Google login for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user = await ensureClientCodeForUser(user); // added by cipherNomad
    sendTokenResponse(user, 200, res);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, name, sub } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub,
        role: "user",
        clientCode: await generateUniqueClientCode() // added by cipherNomad
      });
    }

    user = await ensureClientCodeForUser(user); // added by cipherNomad
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error("Google Auth Error:", error.message);
    res.status(401).json({ message: "Google authentication failed" });
  }
};

exports.createClient = async (req, res) => { // added by cipherNomad
  try { // added by cipherNomad
    const { name, email, password } = req.body; // added by cipherNomad
    if (!name || !email || !password) { // added by cipherNomad
      return res.status(400).json({ message: "Name, email and password are required" }); // added by cipherNomad
    } // added by cipherNomad
    const userExists = await User.findOne({ email }); // added by cipherNomad
    if (userExists) { // added by cipherNomad
      return res.status(400).json({ message: "User already exists" }); // added by cipherNomad
    } // added by cipherNomad
    const hashedPassword = await bcrypt.hash(password, 10); // added by cipherNomad
    const user = await User.create({ // added by cipherNomad
      name, // added by cipherNomad
      email, // added by cipherNomad
      password: hashedPassword, // added by cipherNomad
      role: "user", // added by cipherNomad
      createdBy: req.user.id, // added by cipherNomad
      clientCode: await generateUniqueClientCode() // added by cipherNomad
    }); // added by cipherNomad
    return res.status(201).json({ // added by cipherNomad
      _id: user._id, // added by cipherNomad
      name: user.name, // added by cipherNomad
      email: user.email, // added by cipherNomad
      clientCode: user.clientCode // added by cipherNomad
    }); // added by cipherNomad
  } catch (error) { // added by cipherNomad
    res.status(500).json({ message: error.message }); // added by cipherNomad
  } // added by cipherNomad
}; // added by cipherNomad

exports.getMyClients = async (req, res) => { // added by cipherNomad
  try { // added by cipherNomad
    const clients = await User.find({ role: "user", createdBy: req.user.id }) // added by cipherNomad
      .select("name email clientCode createdAt") // added by cipherNomad
      .sort({ createdAt: -1 }); // added by cipherNomad
    for (const client of clients) { // added by cipherNomad
      await ensureClientCodeForUser(client); // added by cipherNomad
    } // added by cipherNomad
    res.json(clients); // added by cipherNomad
  } catch (error) { // added by cipherNomad
    res.status(500).json({ message: error.message }); // added by cipherNomad
  } // added by cipherNomad
}; // added by cipherNomad

exports.verifyClientByCode = async (req, res) => { // added by cipherNomad
  try { // added by cipherNomad
    const rawIdentifier = (req.query.identifier || req.params.clientCode || "").trim(); // added by cipherNomad
    const identifier = rawIdentifier.toUpperCase(); // added by cipherNomad
    if (!rawIdentifier) { // added by cipherNomad
      return res.status(400).json({ message: "Client code, email, or name is required" }); // added by cipherNomad
    } // added by cipherNomad

    let client = await User.findOne({ role: "user", clientCode: identifier }) // added by cipherNomad
      .select("_id name email clientCode"); // added by cipherNomad

    if (!client && rawIdentifier.includes("@")) { // added by cipherNomad
      client = await User.findOne({ role: "user", email: rawIdentifier.toLowerCase() }) // added by cipherNomad
        .select("_id name email clientCode"); // added by cipherNomad
    } // added by cipherNomad

    if (!client) { // added by cipherNomad
      const escaped = rawIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // added by cipherNomad
      client = await User.findOne({ role: "user", name: new RegExp(`^${escaped}$`, "i") }) // added by cipherNomad
        .select("_id name email clientCode"); // added by cipherNomad
    } // added by cipherNomad

    if (!client) { // added by cipherNomad
      const escaped = rawIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // added by cipherNomad
      client = await User.findOne({ role: "user", name: new RegExp(escaped, "i") }) // added by cipherNomad
        .select("_id name email clientCode"); // added by cipherNomad
    } // added by cipherNomad

    if (!client) { // added by cipherNomad
      return res.status(404).json({ message: "Client not found for this code, email, or name" }); // added by cipherNomad
    } // added by cipherNomad
    await ensureClientCodeForUser(client); // added by cipherNomad
    res.json(client); // added by cipherNomad
  } catch (error) { // added by cipherNomad
    res.status(500).json({ message: error.message }); // added by cipherNomad
  } // added by cipherNomad
}; // added by cipherNomad

exports.getMe = async (req, res) => { // added by cipherNomad
  try { // added by cipherNomad
    const user = await User.findById(req.user.id).select("name email role clientCode createdBy createdAt"); // added by cipherNomad
    if (!user) { // added by cipherNomad
      return res.status(404).json({ message: "User not found" }); // added by cipherNomad
    } // added by cipherNomad
    await ensureClientCodeForUser(user); // added by cipherNomad
    res.json(user); // added by cipherNomad
  } catch (error) { // added by cipherNomad
    res.status(500).json({ message: error.message }); // added by cipherNomad
  } // added by cipherNomad
}; // added by cipherNomad

exports.ensureMyClientCode = async (req, res) => { // added by cipherNomad
  try { // added by cipherNomad
    const user = await User.findById(req.user.id).select("name email role clientCode"); // added by cipherNomad
    if (!user) { // added by cipherNomad
      return res.status(404).json({ message: "User not found" }); // added by cipherNomad
    } // added by cipherNomad
    if (user.role !== "user") { // added by cipherNomad
      return res.status(400).json({ message: "Only clients can have client code" }); // added by cipherNomad
    } // added by cipherNomad
    await ensureClientCodeForUser(user); // added by cipherNomad
    return res.json({ clientCode: user.clientCode }); // added by cipherNomad
  } catch (error) { // added by cipherNomad
    res.status(500).json({ message: error.message }); // added by cipherNomad
  } // added by cipherNomad
}; // added by cipherNomad

exports.backfillMissingClientCodes = async () => { // added by cipherNomad
  const users = await User.find({ role: "user", $or: [{ clientCode: { $exists: false } }, { clientCode: "" }, { clientCode: null }] }) // added by cipherNomad
    .select("name email role clientCode"); // added by cipherNomad
  for (const user of users) { // added by cipherNomad
    await ensureClientCodeForUser(user); // added by cipherNomad
  } // added by cipherNomad
  return users.length; // added by cipherNomad
}; // added by cipherNomad
