import { describe, it, expect, vi } from "vitest";
import { SavePushSubscriptionUseCase } from "../modules/notifications/application/use-cases/SavePushSubscriptionUseCase";
import { RemovePushSubscriptionUseCase } from "../modules/notifications/application/use-cases/RemovePushSubscriptionUseCase";
import { SendPushToUserUseCase } from "../modules/notifications/application/use-cases/SendPushToUserUseCase";

const sub = (endpoint: string) => ({
  id: "1",
  schoolId: "s1",
  userId: "u1",
  endpoint,
  p256dh: "k1",
  auth: "a1",
  userAgent: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("Push subscription & send", () => {
  it("save upsert by endpoint", async () => {
    const repo = { upsert: vi.fn().mockResolvedValue(sub("e1")) } as any;
    const uc = new SavePushSubscriptionUseCase(repo);
    const res = await uc.execute({ schoolId: "s1", userId: "u1", endpoint: "https://push/e1", p256dh: "k", auth: "a" });
    expect(res.endpoint).toBe("e1");
    expect(repo.upsert).toHaveBeenCalledTimes(1);
  });

  it("send kirim paralel + hapus basi 410", async () => {
    const repo = {
      listByUser: vi.fn().mockResolvedValue([sub("ok"), sub("gone")]),
      deleteByEndpoint: vi.fn().mockResolvedValue(undefined),
    } as any;
    const sender = {
      send: vi.fn().mockImplementation(async (s: any) =>
        s.endpoint === "gone" ? { endpoint: s.endpoint, gone: true } : { endpoint: s.endpoint, gone: false }
      ),
    } as any;
    const uc = new SendPushToUserUseCase(repo, sender);
    const res = await uc.execute({ userId: "u1", schoolId: "s1", payload: { title: "T", body: "B", url: "#/yaumiyah" } });
    expect(res).toEqual({ sent: 1, removed: 1 });
    expect(repo.deleteByEndpoint).toHaveBeenCalledWith("gone");
  });

  it("remove scoped milik sendiri", async () => {
    const repo = { removeByEndpoint: vi.fn().mockResolvedValue(undefined) } as any;
    const uc = new RemovePushSubscriptionUseCase(repo);
    await uc.execute({ endpoint: "https://push/e1", userId: "u1", schoolId: "s1" });
    expect(repo.removeByEndpoint).toHaveBeenCalledWith("https://push/e1", "u1", "s1");
  });
});
