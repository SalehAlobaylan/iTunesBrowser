// Note: YOU HAVE TO RUN THE SERVER FIRST! i just want to make it very simple for the code
import supertest from "supertest";

describe("/search endpoint", () => {
  const baseURL = "http://localhost:4000";

  test("should return podcasts when searching with valid term", async () => {
    const response = await supertest(baseURL)
      .post("/search")
      .send({ searchTerm: "tech" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success");
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
