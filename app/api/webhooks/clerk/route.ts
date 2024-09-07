/* eslint-disable camelcase */
// Resource: https://clerk.com/docs/users/sync-data-to-your-backend
// Above article shows why we need webhooks i.e., to sync data to our backend

// Resource: https://docs.svix.com/receiving/verifying-payloads/why
// It's a good practice to verify webhooks. Above article shows why we should do it
// import { Webhook, WebhookRequiredHeaders } from "svix";
import { Webhook } from "svix";
import { headers } from "next/headers";

// import { IncomingHttpHeaders } from "http";

import { NextResponse } from "next/server";
import {
  addMemberToCommunity,
  createCommunity,
  deleteCommunity,
  removeUserFromCommunity,
  updateCommunityInfo,
} from "@/lib/actions/community.actions";

import { WebhookEvent } from "@clerk/nextjs/server";

// import { limiter } from "@/middleware";
// import { NextRequest } from "next/server";
// import { createRouter } from "next-connect";

// import { NextRequest } from "next/server";
// import { createRouter } from "next-connect";
// const router = createRouter<NextRequest, NextResponse>();

// router.use(limiter);

// router.post(async (req: NextRequest, res: NextResponse) => {
//   // Your API logic here
//   return NextResponse.json({ message: "Request successful" });
// });

// // Replace the existing POST function with the following one
// router.post(async (req: NextRequest, res: NextResponse) => {
//   // Your API logic here
//   return NextResponse.json({ message: "Request successful" });
// });

// Resource: https://clerk.com/docs/integration/webhooks#supported-events
// Above document lists the supported events
// type EventType =
//   | "organization.created"
//   | "organizationInvitation.created"
//   | "organizationMembership.created"
//   | "organizationMembership.deleted"
//   | "organization.updated"
//   | "organization.deleted";

// type Event = {
//   data: Record<string, string | number | Record<string, string>[]>;
//   object: "event";
//   type: EventType;
// };

export const POST = async (req: Request) => {
  // const payload = await request.json();
  // const header = headers();

  // const heads = {
  //   "svix-id": header.get("svix-id"),
  //   "svix-timestamp": header.get("svix-timestamp"),
  //   "svix-signature": header.get("svix-signature"),
  // };

  // // Activitate Webhook in the Clerk Dashboard.
  // // After adding the endpoint, you'll see the secret on the right side.
  // const wh = new Webhook(process.env.WEBHOOK_SECRET || "");

  // let evnt: Event | null = null;

  // try {
  //   evnt = wh.verify(
  //     JSON.stringify(payload),
  //     heads as IncomingHttpHeaders & WebhookRequiredHeaders
  //   ) as Event;
  // } catch (err) {
  //   return NextResponse.json({ message: err }, { status: 400 });
  // }

  // const eventType: EventType = evnt?.type!;

  // Listen organization creation event

  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evnt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evnt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Do something with the payload
  // For this guide, you simply log the payload to the console
  const { id } = evnt.data;
  const eventType = evnt.type;
  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.log("Webhook body:", body);

  // return new Response("", { status: 200 });
  // const logo_url: string | number | Record<string, string>[];

  if (eventType === "organization.created") {
    // Resource: https://clerk.com/docs/reference/backend-api/tag/Organizations#operation/CreateOrganization
    // Show what evnt?.data sends from above resource
    const { id, name, slug, image_url, created_by } = evnt?.data ?? {
      id: "",
      name: "",
      slug: "",
      image_url: "",
      created_by: "",
    };
    evnt?.data ?? {};

    try {
      // @ts-ignore
      await createCommunity(
        // @ts-ignore
        id,
        name,
        slug,
        image_url,
        "org bio",
        created_by
      );

      return NextResponse.json({ message: "User created" }, { status: 201 });
    } catch (err) {
      console.log(err);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization invitation creation event.
  // Just to show. You can avoid this or tell people that we can create a new mongoose action and
  // add pending invites in the database.
  if (eventType === "organizationInvitation.created") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organization-Invitations#operation/CreateOrganizationInvitation
      console.log("Invitation created", evnt?.data);

      return NextResponse.json(
        { message: "Invitation created" },
        { status: 201 }
      );
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization membership (member invite & accepted) creation
  if (eventType === "organizationMembership.created") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organization-Memberships#operation/CreateOrganizationMembership
      // Show what evnt?.data sends from above resource
      const { organization, public_user_data } = evnt?.data;
      console.log("created", evnt?.data);

      // @ts-ignore
      await addMemberToCommunity(organization.id, public_user_data.user_id);

      return NextResponse.json(
        { message: "Invitation accepted" },
        { status: 201 }
      );
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen member deletion event
  if (eventType === "organizationMembership.deleted") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organization-Memberships#operation/DeleteOrganizationMembership
      // Show what evnt?.data sends from above resource
      const { organization, public_user_data } = evnt?.data;
      console.log("removed", evnt?.data);

      // @ts-ignore
      await removeUserFromCommunity(public_user_data.user_id, organization.id);

      return NextResponse.json({ message: "Member removed" }, { status: 201 });
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization updation event
  if (eventType === "organization.updated") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organizations#operation/UpdateOrganization
      // Show what evnt?.data sends from above resource
      const { id, image_url, name, slug } = evnt?.data;
      console.log("updated", evnt?.data);

      // @ts-ignore
      await updateCommunityInfo(id, name, slug, image_url);

      return NextResponse.json({ message: "Member removed" }, { status: 201 });
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization deletion event
  if (eventType === "organization.deleted") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organizations#operation/DeleteOrganization
      // Show what evnt?.data sends from above resource
      const { id } = evnt?.data;
      console.log("deleted", evnt?.data);

      // @ts-ignore
      await deleteCommunity(id);

      return NextResponse.json(
        { message: "Organization deleted" },
        { status: 201 }
      );
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
};

function exponentialBackoff(retries: number) {
  return Math.pow(2, retries) * 100; // Wait time in milliseconds
}

async function makeRequestWithBackoff(
  url: string | Request | URL,
  options: RequestInit | undefined,
  retries = 0
) {
  try {
    const response = await fetch(url, options);
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter
        ? parseInt(retryAfter) * 1000
        : exponentialBackoff(retries);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return makeRequestWithBackoff(url, options, retries + 1);
    }
    return response;
  } catch (error) {
    if (retries < 5) {
      const waitTime = exponentialBackoff(retries);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return makeRequestWithBackoff(url, options, retries + 1);
    }
    throw error;
  }
}
