import React, { useCallback, useMemo } from 'react'
import {
  BackButton,
  Bar,
  Box,
  Button,
  GU,
  Text,
  textStyle,
  Link,
  SidePanel,
  Split,
  useLayout,
  useTheme,
} from '@aragon/ui'
import styled from 'styled-components'
import IdentityBadge from '../components/IdentityBadge'
import Balance from '../components/Balance'
import {
  ConvictionCountdown,
  ConvictionBar,
  ConvictionChart,
} from '../components/ConvictionVisuals'
import usePanelState from '../hooks/usePanelState'
import { useConvictionHistory } from '../hooks/useConvictionHistory'
import { addressesEqualNoSum as addressesEqual } from '../lib/web3-utils'
import SupportProposal from '../components/panels/SupportProposal'
import { useWallet } from '../providers/Wallet'

function ProposalDetail({
  onBack,
  onExecuteProposal,
  onStakeToProposal,
  onWithdrawFromProposal,
  proposal,
  requestToken,
}) {
  const theme = useTheme()
  const { layoutName } = useLayout()

  const { account: connectedAccount } = useWallet()
  const chartLines = useConvictionHistory(proposal)

  const panelState = usePanelState()

  const {
    id,
    name,
    creator,
    beneficiary,
    link,
    requestedAmount,
    executed,
    currentConviction,
    stakes,
    threshold,
  } = proposal

  const myStakes = stakes.filter(({ entity }) =>
    addressesEqual(entity, connectedAccount)
  )

  console.log('j')
  const didIStaked =
    myStakes.length > 0 &&
    myStakes
      .slice(-1)
      .pop()
      .amount.gt(0)

  const handleWithdraw = useCallback(() => {
    onWithdrawFromProposal(id)
  }, [id, onWithdrawFromProposal])

  const handleExecute = useCallback(() => {
    onExecuteProposal(id)
  }, [id, onExecuteProposal])

  const buttonProps = useMemo(() => {
    if (currentConviction.gte(threshold)) {
      return { text: 'Execute proposal', action: handleExecute, mode: 'strong' }
    }
    // TOD - Update mode is intended for the change support feature, the button name will be changed on next pr
    if (didIStaked) {
      return {
        text: 'Withdraw support',
        action: handleWithdraw,
        mode: 'normal',
      }
    }
    return {
      text: 'Support this proposal',
      action: panelState.requestOpen,
      mode: 'strong',
    }
  }, [
    currentConviction,
    didIStaked,
    handleExecute,
    handleWithdraw,
    panelState,
    threshold,
  ])

  return (
    <div>
      <Bar>
        <BackButton onClick={onBack} />
      </Bar>
      <Split
        primary={
          <div>
            <Box>
              <section
                css={`
                  display: grid;
                  grid-template-rows: auto;
                  grid-gap: ${2.5 * GU}px;
                  margin-top: ${2.5 * GU}px;
                `}
              >
                <h1
                  css={`
                    ${textStyle('title2')};
                    font-weight: 600;
                  `}
                >
                  #{id} {name}
                </h1>
                <div
                  css={`
                    display: grid;
                    grid-template-columns: ${layoutName !== 'small'
                      ? 'auto auto auto auto'
                      : 'auto'};
                    grid-gap: ${layoutName !== 'small' ? 5 * GU : 2.5 * GU}px;
                  `}
                >
                  {requestToken && (
                    <Amount
                      requestedAmount={requestedAmount}
                      requestToken={requestToken}
                    />
                  )}
                  <div>
                    <Heading color={theme.surfaceContentSecondary}>
                      Link
                    </Heading>
                    {link ? (
                      <Link href={link} external>
                        Read more
                      </Link>
                    ) : (
                      <Text
                        css={`
                          ${textStyle('body2')};
                        `}
                      >
                        No link provided
                      </Text>
                    )}
                  </div>
                  <div>
                    <Heading color={theme.surfaceContentSecondary}>
                      Created By
                    </Heading>
                    <div
                      css={`
                        display: flex;
                        align-items: flex-start;
                      `}
                    >
                      <IdentityBadge
                        connectedAccount={addressesEqual(
                          creator,
                          connectedAccount
                        )}
                        entity={creator}
                      />
                    </div>
                  </div>
                  {requestToken && (
                    <div>
                      <Heading color={theme.surfaceContentSecondary}>
                        Beneficiary
                      </Heading>
                      <div
                        css={`
                          display: flex;
                          align-items: flex-start;
                        `}
                      >
                        <IdentityBadge
                          connectedAccount={addressesEqual(
                            beneficiary,
                            connectedAccount
                          )}
                          entity={beneficiary}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {!executed && (
                  <React.Fragment>
                    <div css="width: 100%;">
                      <Heading color={theme.surfaceContentSecondary}>
                        Conviction prediction
                      </Heading>
                      <ConvictionChart
                        proposal={proposal}
                        withThreshold={!!requestToken}
                        lines={chartLines}
                      />
                    </div>
                    <Button
                      wide
                      mode={buttonProps.mode}
                      onClick={buttonProps.action}
                    >
                      {buttonProps.text}
                    </Button>
                  </React.Fragment>
                )}
              </section>
            </Box>
          </div>
        }
        secondary={
          <div>
            {requestToken && (
              <Box heading="Status" padding={3 * GU}>
                <ConvictionCountdown proposal={proposal} />
              </Box>
            )}
            {!proposal.executed && (
              <Box heading="Conviction Progress" padding={3 * GU}>
                <ConvictionBar
                  proposal={proposal}
                  withThreshold={!!requestToken}
                />
              </Box>
            )}
          </div>
        }
      />
      <SidePanel
        title="Support this proposal"
        opened={panelState.visible}
        onClose={panelState.requestClose}
      >
        <SupportProposal
          id={id}
          onDone={panelState.requestClose}
          onStakeToProposal={onStakeToProposal}
        />
      </SidePanel>
    </div>
  )
}

const Amount = ({
  requestedAmount = 0,
  requestToken: { symbol, decimals, verified },
}) => (
  <div>
    <Heading color={useTheme().surfaceContentSecondary}>Amount</Heading>
    <Balance
      amount={requestedAmount}
      decimals={decimals}
      symbol={symbol}
      verified={verified}
    />
  </div>
)

const Heading = styled.h2`
  ${textStyle('label2')};
  color: ${props => props.color};
  margin-bottom: ${1.5 * GU}px;
`

export default ProposalDetail
