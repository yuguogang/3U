import { resetUatReport } from "./report";

export default async function globalSetup() {
  resetUatReport();
}
