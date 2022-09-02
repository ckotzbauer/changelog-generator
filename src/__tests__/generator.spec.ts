import { getCategoryHeadline, reformatCommit } from "../generator";
import { describe, it, expect } from '@jest/globals';

describe("generator", () => {
    describe("reformatCommit", () => {
        it("should extract categories - default category", () => {
            const commit = "update dependency @types/node to v13.13.45";
            const formatted = reformatCommit(commit);
            expect(formatted.category).toEqual("chore");
            expect(formatted.title).toEqual("update dependency @types/node to v13.13.45");
        });

        it("should extract categories - 1", () => {
            const commit = "chore: update dependency @types/node to v13.13.45";
            const formatted = reformatCommit(commit);
            expect(formatted.category).toEqual("chore");
            expect(formatted.title).toEqual("update dependency @types/node to v13.13.45");
        });

        it("should extract categories - 2", () => {
            const commit = "build,test: update dependency @types/node to v13.13.45";
            const formatted = reformatCommit(commit);
            expect(formatted.category).toEqual("build,test");
            expect(formatted.title).toEqual("update dependency @types/node to v13.13.45");
        });

        it("should extract categories - extract scope", () => {
            const commit = "build(deps): update dependency @types/node to v13.13.45";
            const formatted = reformatCommit(commit);
            expect(formatted.category).toEqual("deps");
            expect(formatted.title).toEqual("update dependency @types/node to v13.13.45");
        });

        it("should extract categories - 3", () => {
            const commit = "security: deep package update";
            const formatted = reformatCommit(commit);
            expect(formatted.category).toEqual("security");
            expect(formatted.title).toEqual("deep package update");
        });

        it("should be case-insensitive", () => {
            const commit = "Security: deep package update";
            const formatted = reformatCommit(commit);
            expect(formatted.category).toEqual("security");
            expect(formatted.title).toEqual("deep package update");
        });
    });

    describe("getCategoryHeadline", () => {
        it("should return correct group - 1", () => {
            const commit = "update dependency @types/node to v13.13.45";
            const formatted = reformatCommit(commit);
            const group = getCategoryHeadline(formatted.category);
            expect(group.order).toEqual(99);
        });

        it("should return correct group - 2", () => {
            const commit = "chore: update dependency @types/node to v13.13.45";
            const formatted = reformatCommit(commit);
            const group = getCategoryHeadline(formatted.category);
            expect(group.order).toEqual(99);
        });

        it("should return correct group - 3", () => {
            const commit = "build,test: update dependency @types/node to v13.13.45";
            const formatted = reformatCommit(commit);
            const group = getCategoryHeadline(formatted.category);
            expect(group.order).toEqual(99);
        });

        it("should return correct group - 4", () => {
            const commit = "build(deps): update dependency @types/node to v13.13.45";
            const formatted = reformatCommit(commit);
            const group = getCategoryHeadline(formatted.category);
            expect(group.order).toEqual(7);
        });

        it("should return correct group - 5", () => {
            const commit = "security: deep package update";
            const formatted = reformatCommit(commit);
            const group = getCategoryHeadline(formatted.category);
            expect(group.order).toEqual(6);
        });

        it("should be case-insensitive", () => {
            const commit = "Security: deep package update";
            const formatted = reformatCommit(commit);
            const group = getCategoryHeadline(formatted.category);
            expect(group.order).toEqual(6);
        });
    });
});
