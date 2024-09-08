import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const ignoredRoutes = ["/api/webhooks/clerk"];
const publicRoutes = ["/api/webhooks/clerk"];

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request) && !ignoredRoutes.includes(request.url)) {
    auth().protect();
    publicRoutes;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
// const publicRoutes = ["/api/webhooks/clerk"];
// const ignoredRoutes = ["/api/webhooks/clerk"];

// // export default clerkMiddleware((auth, request) => {
// //   if (!isPublicRoute(request) && !ignoredRoutes.includes(request.url)) {
// //     auth().protect();
// //   }
// // });

// export default clerkMiddleware((auth, request) => {
//   if (!isPublicRoute(request)) {
//     auth().protect();
//   }
//   publicRoutes;
//   ignoredRoutes;
// });

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     // Always run for API routes
//     "/(api|trpc)(.*)",
//   ],
// };

// import rateLimit from "express-rate-limit";

// export const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
// });

// Resource: https://clerk.com/docs/nextjs/middleware#auth-middleware
// Copy the middleware code as it is from the above resource

// import { authMiddleware } from "@clerk/nextjs/server";

// export default authMiddleware({
//   // An array of public routes that don't require authentication.
//   publicRoutes: ["/api/webhooks/clerk"],

//   // An array of routes to be ignored by the authentication middleware.
//   ignoredRoutes: ["/api/webhooks/clerk"],
// });

// export const config = {
//   matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
// };
