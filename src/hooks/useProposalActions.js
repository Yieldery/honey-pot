import { useCallback } from 'react'
import { useAppState } from '../providers/AppState'
import { useWallet } from '../providers/Wallet'
import { toDecimals } from '../lib/math-utils'
import { toHex } from 'web3-utils'

export default function useProposalActions(onDone) {
  const { account, ethers } = useWallet()

  const { organization, convictionVoting, requestToken } = useAppState()

  const newProposal = useCallback(
    async ({ title, link, amount, beneficiary }) => {
      const { decimals } = requestToken
      const decimalAmount = toDecimals(amount.trim(), decimals).toString()

      sendIntent(
        organization,
        convictionVoting.appAddress,
        'addProposal',
        [title, toHex(link), decimalAmount, beneficiary],
        { ethers, from: account }
      )

      onDone()
    },
    [account, convictionVoting, ethers, onDone, organization, requestToken]
  )

  const stakeToProposal = useCallback(
    (proposalId, amount) => {
      console.log('STAKE ', typeof amount)
      sendIntent(
        organization,
        convictionVoting.appAddress,
        'stakeToProposal',
        [proposalId, amount],
        { ethers, from: account }
      )

      onDone()
    },
    [account, convictionVoting, ethers, onDone, organization]
  )

  const withdrawFromProposal = useCallback(
    (proposalId, amount) => {
      sendIntent(
        organization,
        convictionVoting.appAddress,
        'withdrawFromProposal',
        [proposalId, amount],
        { ethers, from: account }
      )

      onDone()
    },
    [account, convictionVoting, ethers, onDone, organization]
  )

  const executeProposal = useCallback(
    proposalId => {
      sendIntent(
        organization,
        convictionVoting.appAddress,
        'executeProposal',
        [proposalId, true],
        { ethers, from: account }
      )

      onDone()
    },
    [account, convictionVoting, ethers, onDone, organization]
  )

  return { newProposal, stakeToProposal, withdrawFromProposal, executeProposal }
}

async function sendIntent(
  organization,
  appAddress,
  fn,
  params,
  { ethers, from }
) {
  try {
    const intent = organization.appIntent(appAddress, fn, params)

    const txPath = await intent.paths(from)

    const { to, data } = txPath.transactions[0] // TODO: Handle errors when no tx path is found
    ethers.getSigner().sendTransaction({ data, to })
  } catch (err) {
    console.error('Could not create tx:', err)
  }
}