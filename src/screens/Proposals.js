import React, { useCallback, useMemo } from 'react'
import {
  Box,
  Button,
  DataView,
  Link,
  GU,
  IconPlus,
  Text,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui'
import { getTokenIconBySymbol } from '../lib/token-utils'
import { useHistory } from 'react-router-dom'

import {
  ConvictionBar,
  ConvictionCountdown,
} from '../components/ConvictionVisuals'
import Balance from '../components/Balance'
import FilterBar from '../components/FilterBar/FilterBar'
import IdentityBadge from '../components/IdentityBadge'
import { useWallet } from '../providers/Wallet'

import { addressesEqualNoSum as addressesEqual } from '../lib/web3-utils'

const ENTRIES_PER_PAGE = 5

const Proposals = React.memo(
  ({
    filteredProposals,
    proposalExecutionStatusFilter,
    proposalSupportStatusFilter,
    proposalTextFilter,
    handleProposalSupportFilterChange,
    handleExecutionStatusFilterChange,
    handleSearchTextFilterChange,
    requestToken,
    onRequestNewProposal,
  }) => {
    const { account } = useWallet()
    const { layoutName } = useLayout()
    const compactMode = layoutName === 'small'

    const {
      convictionFields = [],
      beneficiaryField = [],
      linkField = [],
    } = useMemo(() => {
      if (proposalExecutionStatusFilter === 0) {
        return {
          convictionFields: [{ label: 'Conviction progress', align: 'start' }],
        }
      }

      return {
        beneficiaryField: [{ label: 'Beneficiary', align: 'start' }],
        linkField: [{ label: 'Link', align: 'start' }],
      }
    }, [proposalExecutionStatusFilter])

    const requestedField = requestToken
      ? [{ label: 'Requested', align: 'start' }]
      : []
    const statusField = requestToken
      ? [{ label: 'Status', align: 'start' }]
      : []

    const sortedProposals = filteredProposals.sort(
      (a, b) => b.currentConviction - a.currentConviction // desc order
    )

    const updateTextFilter = useCallback(
      textValue => {
        handleSearchTextFilterChange(textValue)
      },
      [handleSearchTextFilterChange]
    )

    const history = useHistory()
    const handleSelectProposal = useCallback(
      id => {
        history.push(`/proposal/${id}`)
      },
      [history]
    )

    return (
      <div>
        <Box padding={2 * GU}>
          <div
            css={`
              display: flex;
              align-items: center;
              justify-content: space-between;
            `}
          >
            {account && (
              <Button
                mode="strong"
                onClick={onRequestNewProposal}
                label="New proposal"
                icon={<IconPlus />}
                display={compactMode ? 'icon' : 'label'}
              />
            )}
            <FilterBar
              proposalsSize={filteredProposals.length}
              proposalExecutionStatusFilter={proposalExecutionStatusFilter}
              proposalStatusFilter={proposalSupportStatusFilter}
              proposalTextFilter={proposalTextFilter}
              handleExecutionStatusFilterChange={
                handleExecutionStatusFilterChange
              }
              handleProposalStatusFilterChange={
                handleProposalSupportFilterChange
              }
              handleTextFilterChange={updateTextFilter}
            />
          </div>
        </Box>

        <DataView
          fields={[
            { label: 'Proposal', align: 'start' },
            ...linkField,
            ...requestedField,
            ...convictionFields,
            ...beneficiaryField,
            ...statusField,
          ]}
          emptyState={
            <p
              css={`
                ${textStyle('title2')};
                font-weight: 600;
              `}
            >
              No proposals yet!
            </p>
          }
          entries={sortedProposals}
          renderEntry={proposal => {
            const entriesElements = [
              <IdAndTitle
                id={proposal.id}
                name={proposal.name}
                selectProposal={handleSelectProposal}
              />,
            ]
            if (proposal.executed || !requestToken) {
              entriesElements.push(
                <Link href={proposal.link} external>
                  Read more
                </Link>
              )
            }
            if (requestToken) {
              entriesElements.push(
                <Amount
                  requestedAmount={proposal.requestedAmount}
                  requestToken={requestToken}
                />
              )
            }
            if (!proposal.executed) {
              entriesElements.push(
                <ProposalInfo proposal={proposal} requestToken={requestToken} />
              )
            }
            if (proposal.executed) {
              entriesElements.push(
                <IdentityBadge
                  connectedAccount={addressesEqual(proposal.creator, account)}
                  entity={proposal.creator}
                />
              )
            }
            if (requestToken) {
              entriesElements.push(
                <ConvictionCountdown proposal={proposal} shorter />
              )
            }
            return entriesElements
          }}
          tableRowHeight={14 * GU}
          entriesPerPage={ENTRIES_PER_PAGE}
        />
      </div>
    )
  }
)

const ProposalInfo = ({ proposal, requestToken, selectProposal = false }) => {
  return (
    <div
      css={`
        width: ${23 * GU}px;
      `}
    >
      {selectProposal && (
        <IdAndTitle {...proposal} selectProposal={selectProposal} />
      )}
      <ConvictionBar proposal={proposal} withThreshold={requestToken} />
    </div>
  )
}

const IdAndTitle = ({ id, name, selectProposal }) => (
  <Link onClick={() => selectProposal(id)}>
    <Text color={useTheme().surfaceContentSecondary.toString()}>{name}</Text>
  </Link>
)

const Amount = ({
  requestedAmount = 0,
  requestToken: { symbol, decimals, verified },
}) => {
  const tokenIcon = getTokenIconBySymbol(symbol)
  return (
    <div>
      <Balance
        amount={requestedAmount}
        decimals={decimals}
        symbol={symbol}
        verified={verified}
        icon={tokenIcon}
      />
    </div>
  )
}

export default Proposals
