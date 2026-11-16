// import type { NextFunction, Request, Response } from "express";

// import User from "../types/user.types.js";
// import { verifyAccessToken } from "../utils/jwt.js";

// const authMiddleware = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     // STEP 1:- Read access token from cookies
//     const accessToken = req.cookies.accessToken;

//     if (!accessToken) {
//       res.status(401).json({
//         success: false,
//         message: "Unauthorized access",
//       });

//       return;
//     }

//     // STEP 2:- Verify token
//     const decoded = verifyAccessToken(accessToken);

//     // STEP 3:- Find user
//     const user = await User.findById(decoded.userId);

//     if (!user) {
//       res.status(401).json({
//         success: false,
//         message: "User not found",
//       });

//       return;
//     }

//     // STEP 4:- Check active status
//     if (!user.isActive) {
//       res.status(403).json({
//         success: false,
//         message: "Account disabled",
//       });

//       return;
//     }

//     // STEP 5:- Attach user to request
//     req.user = user;

//     next();
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       message: "Invalid or expired token",
//     });
//   }
// };

// export default authMiddleware;
