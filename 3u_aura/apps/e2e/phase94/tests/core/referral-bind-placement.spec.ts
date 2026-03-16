import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { ClientUser, ReferralPlacementSlotView } from "3u-aura-common";
import { appendUatReport } from "../../src/report";
import {
  getMyProfile,
  getPendingPlacements,
  getSelectableSlots,
} from "../../src/server-api";
import { bootstrapDappSession } from "../../src/session-bootstrap";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";

function getByTestId(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"]`);
}

async function gotoTeamPage(page: Page) {
  const runtime = loadRuntimeConfig();
  await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/team`);
}

async function ensureInviterBinding(params: {
  inviteCode: string;
  page: Page;
  referrerProfile: ClientUser;
  userAAccessToken: string;
  userAProfile: ClientUser;
  userAWalletAddress: string;
}) {
  const {
    inviteCode,
    page,
    referrerProfile,
    userAAccessToken,
    userAProfile,
    userAWalletAddress,
  } = params;

  if (
    userAProfile.inviterId &&
    userAProfile.inviterId !== referrerProfile.id
  ) {
    throw new Error(
      `userA is already bound to a different inviter: ${userAProfile.inviterId}`,
    );
  }

  await gotoTeamPage(page);

  if (userAProfile.inviterId === referrerProfile.id) {
    await expect(page.locator("body")).toContainText(/Inviter bound:\s*Yes/);
    appendUatReport({
      test: "referral-bind-placement",
      step: "userA-bind-referrer",
      wallet: userAWalletAddress,
      result: "success",
      uiCheckpoint: "already-bound",
    });
    return userAProfile;
  }

  await getByTestId(page, "team-bind-invite-code-input").fill(inviteCode);
  await getByTestId(page, "team-bind-inviter-button").click();

  await expect
    .poll(async () => {
      const profileResponse = await getMyProfile(userAAccessToken);
      return profileResponse.data.inviterId ?? null;
    })
    .toBe(referrerProfile.id);

  await expect(page.locator("body")).toContainText(/Inviter bound:\s*Yes/);

  const updatedProfile = (await getMyProfile(userAAccessToken)).data;
  appendUatReport({
    test: "referral-bind-placement",
    step: "userA-bind-referrer",
    wallet: userAWalletAddress,
    result: "success",
    apiStatus: 200,
    uiCheckpoint: "bind-confirmed",
  });
  return updatedProfile;
}

async function ensurePlacement(params: {
  page: Page;
  referrerAccessToken: string;
  referrerWalletAddress: string;
  selectedSlot?: ReferralPlacementSlotView;
  userAAccessToken: string;
  userAProfile: ClientUser;
}) {
  const {
    page,
    referrerAccessToken,
    referrerWalletAddress,
    selectedSlot,
    userAAccessToken,
    userAProfile,
  } = params;

  if (userAProfile.parentId) {
    await gotoTeamPage(page);
    await expect(page.locator("body")).toContainText(/Pending placements/);
    appendUatReport({
      test: "referral-bind-placement",
      step: "referrer-place-userA",
      wallet: referrerWalletAddress,
      result: "success",
      uiCheckpoint: "already-placed",
    });
    return userAProfile;
  }

  if (!selectedSlot) {
    throw new Error("No selectable slot is available for referrer placement");
  }

  const pendingPlacements = (await getPendingPlacements(referrerAccessToken)).data;
  const isUserAPending = pendingPlacements.some(
    (item) => item.userId === userAProfile.id,
  );
  expect(isUserAPending).toBe(true);

  await gotoTeamPage(page);
  await getByTestId(page, `team-pending-placement-${userAProfile.id}`).click();
  await getByTestId(page, `team-slot-${selectedSlot.placementKey}`).click();
  await getByTestId(page, "team-confirm-placement-button").click();

  await expect
    .poll(async () => {
      const profileResponse = await getMyProfile(userAAccessToken);
      const nextProfile = profileResponse.data;
      return nextProfile.parentId
        ? JSON.stringify({
            parentId: nextProfile.parentId,
            placementKey: nextProfile.placementKey,
            teamPosition: nextProfile.teamPosition,
          })
        : null;
    })
    .toBe(
      JSON.stringify({
        parentId: selectedSlot.parentId,
        placementKey: selectedSlot.placementKey,
        teamPosition: selectedSlot.teamPosition,
      }),
    );

  await expect(
    getByTestId(page, `team-pending-placement-${userAProfile.id}`),
  ).toHaveCount(0);

  const updatedProfile = (await getMyProfile(userAAccessToken)).data;
  appendUatReport({
    test: "referral-bind-placement",
    step: "referrer-place-userA",
    wallet: referrerWalletAddress,
    result: "success",
    apiStatus: 200,
    uiCheckpoint: selectedSlot.placementKey,
  });
  return updatedProfile;
}

test("@phase94-core referrer can ensure userA inviter binding and placement", async ({
  browser,
}) => {
  const runtime = loadRuntimeConfig();
  const referrerWallet = loadWalletFixture("referrer", runtime.environment);
  const userAWallet = loadWalletFixture("userA", runtime.environment);
  const referrerContext = await browser.newContext();
  const userAContext = await browser.newContext();
  const referrerPage = await referrerContext.newPage();
  const userAPage = await userAContext.newPage();

  try {
    const referrerSignin = await bootstrapDappSession(referrerPage, referrerWallet);
    const userASignin = await bootstrapDappSession(userAPage, userAWallet);

    const referrerProfile = (await getMyProfile(referrerSignin.accessToken)).data;
    const initialUserAProfile = (await getMyProfile(userASignin.accessToken)).data;

    expect(referrerProfile.inviteCode).toBeTruthy();

    const boundUserAProfile = await ensureInviterBinding({
      inviteCode: referrerProfile.inviteCode!,
      page: userAPage,
      referrerProfile,
      userAAccessToken: userASignin.accessToken,
      userAProfile: initialUserAProfile,
      userAWalletAddress: userAWallet.address,
    });

    const selectableSlots = boundUserAProfile.parentId
      ? []
      : (await getSelectableSlots(referrerSignin.accessToken)).data;
    const selectedSlot = selectableSlots[0];

    const placedUserAProfile = await ensurePlacement({
      page: referrerPage,
      referrerAccessToken: referrerSignin.accessToken,
      referrerWalletAddress: referrerWallet.address,
      selectedSlot,
      userAAccessToken: userASignin.accessToken,
      userAProfile: boundUserAProfile,
    });

    expect(placedUserAProfile.inviterId).toBe(referrerProfile.id);
    expect(placedUserAProfile.parentId).toBeTruthy();
    expect(placedUserAProfile.teamPosition).toBeTruthy();
    expect(placedUserAProfile.placementKey).toBeTruthy();
  } catch (error) {
    appendUatReport({
      test: "referral-bind-placement",
      step: "referrer-userA-team-flow",
      wallet: userAWallet.address,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await userAContext.close();
    await referrerContext.close();
  }
});
