import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword, createSession, destroySession, getSession, type SessionUser } from "../lib/auth";
import { cookies } from "next/headers";

// Mock next/headers
vi.mock("next/headers", () => {
  const mockSet = vi.fn();
  const mockGet = vi.fn();
  return {
    cookies: () => ({
      set: mockSet,
      get: mockGet,
    }),
  };
});

describe("auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-value-longer-than-32-chars-for-hs256";
  });

  describe("password hashing", () => {
    it("should hash a password and verify it correctly", async () => {
      const password = "mySecurePassword123";
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword("wrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("session management", () => {
    const mockUser: SessionUser = {
      id: 42,
      name: "Sam Safety",
      email: "safety@transitops.com",
      role: "SAFETY_OFFICER",
    };

    it("should create a session by setting a cookie", async () => {
      const cookieStore = cookies();
      await createSession(mockUser);

      expect(cookieStore.set).toHaveBeenCalledTimes(1);
      const [name, value, options] = vi.mocked(cookieStore.set).mock.calls[0];
      
      expect(name).toBe("transitops_session");
      expect(value).toBeDefined();
      expect(options).toEqual(
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        })
      );
    });

    it("should destroy a session by clearing the cookie", () => {
      const cookieStore = cookies();
      destroySession();

      expect(cookieStore.set).toHaveBeenCalledTimes(1);
      expect(cookieStore.set).toHaveBeenCalledWith(
        "transitops_session",
        "",
        expect.objectContaining({ path: "/", maxAge: 0 })
      );
    });

    it("should get session user from a valid cookie", async () => {
      const cookieStore = cookies();
      
      // First create a session to get the token value
      let generatedToken = "";
      vi.mocked(cookieStore.set).mockImplementation(((_name: string, value: string) => {
        generatedToken = value;
      }) as never);
      await createSession(mockUser);

      // Mock cookieStore.get to return the generated token
      vi.mocked(cookieStore.get).mockReturnValue({ value: generatedToken } as any);

      const session = await getSession();
      expect(session).toEqual(mockUser);
    });

    it("should return null if no session cookie exists", async () => {
      const cookieStore = cookies();
      vi.mocked(cookieStore.get).mockReturnValue(undefined);

      const session = await getSession();
      expect(session).toBeNull();
    });

    it("should return null if session cookie is invalid", async () => {
      const cookieStore = cookies();
      vi.mocked(cookieStore.get).mockReturnValue({ value: "invalid-token-string" } as any);

      const session = await getSession();
      expect(session).toBeNull();
    });
  });
});
