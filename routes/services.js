const express = require("express");

const router = express.Router();

const Service = require("../models/Service");
const Business = require("../models/Business");

const auth = require("../middleware/auth");


const multer = require("multer");
const cloudinary = require("cloudinary").v2;

/* ================= CLOUDINARY CONFIG ================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ================= MEMORY STORAGE ================= */

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================= UPLOAD HELPER ================= */

function uploadToCloudinary(
  buffer,
  resourceType = "image"
) {
  return new Promise((resolve, reject) => {

    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder:
            "navu-smartbiz-services",
          resource_type:
            resourceType
        },
        (error, result) => {

          if (error)
            reject(error);
          else
            resolve(result);
        }
      );

    stream.end(buffer);
  });
}


/* =========================
   CREATE SERVICE
========================= */

router.post(
  "/",
  auth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res) => {

  console.log("=== SERVICE REQUEST RECEIVED ===");
  console.log("BODY:", req.body);
  console.log("FILES:", Object.keys(req.files || {}));

  try {

    const business =
      await Business.findOne({

        owner:
          req.user.user
      });

    if (!business) {

      return res.status(400).json({
        message:
          "No business linked"
      });
    }

    let imageUrl = "";
    let videoUrl = "";

    if (req.files?.image?.[0]) {

      const uploaded =
        await uploadToCloudinary(
          req.files.image[0].buffer,
          "image"
        );

      imageUrl =
        uploaded.secure_url;
    }

    if (req.files?.video?.[0]) {

      const uploaded =
        await uploadToCloudinary(
          req.files.video[0].buffer,
          "video"
        );

      videoUrl =
        uploaded.secure_url;
    }

    const service =
      await Service.create({

        name:
          req.body.name,

        description:
          req.body.description || "",

        price:
          req.body.price,

        duration:
          req.body.duration || 30,

        image:
          imageUrl,

        video:
          videoUrl,

        business:
          business._id,

        owner:
          req.user.user
      });

    res.status(201).json(
      service
    );

  } catch (err) {

    console.error(
      "CREATE SERVICE ERROR:",
      err
    );

    res.status(500).json({
      message:
        err.message
    });
  }
});

/* =========================
   PUBLIC SERVICES
========================= */

router.get("/public", async (req, res) => {

  try {

    const services =
      await Service.find({
        isActive: true
      })
      .populate(
        "business",
        "name slug whatsappNumber"
      )
      .sort({
        createdAt: -1
      });

    res.json(services);

  } catch (err) {

    console.error(
      "PUBLIC SERVICES ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Failed to load services"
    });
  }
});


/* =========================
   GET BUSINESS SERVICES
========================= */

router.get("/", auth, async (req, res) => {

  try {

    const business =
      await Business.findOne({

        owner:
          req.user.user
      });

    if (!business) {

      return res.status(400).json({
        message:
          "No business linked"
      });
    }

    console.log("AUTH USER:", req.user);
    console.log("BUSINESS FOUND:", business);

    const services =
      await Service.find({

        business:
          business._id

      }).sort({
        createdAt: -1
      });

    res.json(
      services
    );

  } catch (err) {

    console.error(
      "GET SERVICES ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Failed to load services"
    });
  }
});


/* =========================
   DELETE SERVICE
========================= */

router.delete("/:id", auth, async (req, res) => {

  try {

    const service =
      await Service.findByIdAndDelete(
        req.params.id
      );

    if (!service) {
      return res.status(404).json({
        message: "Service not found"
      });
    }

    res.json({
      message: "Service deleted ✅"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});

/* =========================
   DELETE IMAGE
========================= */

router.delete("/:id/image", auth, async (req, res) => {

  try {

    const service =
      await Service.findById(
        req.params.id
      );

    if (!service) {
      return res.status(404).json({
        message: "Service not found"
      });
    }

    service.image = "";

    await service.save();

    res.json({
      message: "Image removed ✅"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});

/* =========================
   DELETE VIDEO
========================= */

router.delete("/:id/video", auth, async (req, res) => {

  try {

    const service =
      await Service.findById(
        req.params.id
      );

    if (!service) {
      return res.status(404).json({
        message: "Service not found"
      });
    }

    service.video = "";

    await service.save();

    res.json({
      message: "Video removed ✅"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});


module.exports = router;
