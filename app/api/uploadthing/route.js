import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Export configured GET/POST handlers
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter
});