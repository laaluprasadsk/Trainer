// Loaded ONLY by the isolated E2E runner via NODE_OPTIONS; never imported by the app.
const Module = require("node:module");
const { randomUUID } = require("node:crypto");
const load = Module._load;
const orders = new Map();
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
