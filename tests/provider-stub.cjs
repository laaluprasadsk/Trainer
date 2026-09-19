// Loaded ONLY by the isolated E2E runner via NODE_OPTIONS; never imported by the app.
const Module = require("node:module");
const { randomUUID } = require("node:crypto");
const load = Module._load;
const orders = new Map();
const nativeFetch = global.fetch;
global.fetch = async function testProviderFetch(input, init) {
  const url = typeof input === "string" ? input : input?.url;
  if (url?.startsWith("https://api.resend.com/emails"))
    return new Response(JSON.stringify({ id: `email_${randomUUID()}` }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  if (url?.startsWith("https://control.msg91.com/api/v5/"))
    return new Response(
      JSON.stringify({
        type: "success",
        message: url.includes("otp/verify")
          ? "OTP verified success"
          : "OTP sent",
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  return nativeFetch(input, init);
};
Module._load = function (name, ...args) {
  if (name === "razorpay")
    return class TestGateway {
      orders = {
        create: async (o) => {
          const order = { ...o, id: `order_${randomUUID()}` };
          orders.set(order.id, order);
          return order;
        },
      };
      payments = {
        fetch: async (id) => {
          const o = orders.get(id.slice(4));
          if (!o) throw new Error("Unknown test payment");
          return {
            id,
            order_id: o.id,
            amount: o.amount,
            currency: o.currency,
            status: "captured",
          };
        },
      };
    };
  return load.call(this, name, ...args);
};
