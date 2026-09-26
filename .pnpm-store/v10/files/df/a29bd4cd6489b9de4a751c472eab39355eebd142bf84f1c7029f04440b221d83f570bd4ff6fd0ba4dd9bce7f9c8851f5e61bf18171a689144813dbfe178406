/// <reference types="node" />
import type { Reporter, FullConfig, Suite, TestCase, FullResult, TestResult } from "@playwright/test/reporter";
import { GitHubActionOptions } from "./models";
export { GitHubActionOptions } from "./models";
declare class GitHubAction implements Reporter {
    private options;
    private suite;
    constructor(options?: GitHubActionOptions);
    onBegin(_: FullConfig, suite: Suite): void;
    onStdOut(chunk: string | Buffer, _: void | TestCase, __: void | TestResult): void;
    onStdErr(chunk: string | Buffer, _: TestCase, __: TestResult): void;
    onEnd(result: FullResult): Promise<void>;
}
export default GitHubAction;
