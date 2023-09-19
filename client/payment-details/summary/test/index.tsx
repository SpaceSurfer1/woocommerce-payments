/** @format */
/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import React from 'react';
import moment from 'moment';
import '@wordpress/jest-console';

/**
 * Internal dependencies
 */
import type { Charge } from 'wcpay/types/charges';
import type { Dispute } from 'wcpay/types/disputes';
import PaymentDetailsSummary from '../';
import { useAuthorization } from 'wcpay/data';
import { paymentIntentMock } from 'wcpay/data/payment-intents/test/hooks';

declare const global: {
	wcSettings: {
		locale: {
			siteLocale: string;
		};
	};
	wcpaySettings: {
		isSubscriptionsActive: boolean;
		zeroDecimalCurrencies: string[];
		currencyData: Record< string, any >;
		connect: {
			country: string;
		};
		featureFlags: {
			isDisputeOnTransactionPageEnabled: boolean;
			isAuthAndCaptureEnabled: boolean;
		};
	};
};

jest.mock( 'wcpay/data', () => ( {
	useAuthorization: jest.fn( () => ( {
		authorization: null,
	} ) ),
} ) );

const mockUseAuthorization = useAuthorization as jest.MockedFunction<
	typeof useAuthorization
>;

const getBaseCharge = (): Charge =>
	( {
		id: 'ch_38jdHA39KKA',
		/* Stripe data comes in seconds, instead of the default Date milliseconds */
		created: Date.parse( 'Sep 19, 2019, 5:24 pm' ) / 1000,
		amount: 2000,
		amount_refunded: 0,
		application_fee_amount: 70,
		disputed: false,
		dispute: null,
		currency: 'usd',
		type: 'charge',
		status: 'succeeded',
		paid: true,
		captured: true,
		balance_transaction: {
			amount: 2000,
			currency: 'usd',
			fee: 70,
		},
		refunds: {
			data: [],
		},
		order: {
			number: 45981,
			url: 'https://somerandomorderurl.com/?edit_order=45981',
		},
		billing_details: {
			name: 'Customer name',
		},
		payment_method_details: {
			card: {
				brand: 'visa',
				last4: '4242',
			},
			type: 'card',
		},
		outcome: {
			risk_level: 'normal',
		},
	} as any );

const getBaseDispute = (): Dispute =>
	( {
		id: 'dp_1',
		amount: 2000,
		charge: 'ch_38jdHA39KKA',
		order: null,
		balance_transactions: [
			{
				amount: -1500,
				currency: 'usd',
				fee: 1500,
				reporting_category: 'dispute',
			},
		],
		created: 1693453017,
		currency: 'usd',
		evidence: {
			billing_address: '123 test address',
			customer_email_address: 'test@email.com',
			customer_name: 'Test customer',
			shipping_address: '123 test address',
		},
		evidence_details: {
			due_by: 1694303999,
			has_evidence: false,
			past_due: false,
			submission_count: 0,
		},
		issuer_evidence: null,
		metadata: {},
		payment_intent: 'pi_1',
		reason: 'fraudulent',
		status: 'needs_response',
	} as Dispute );

const getBaseMetadata = () => ( {
	platform: 'ios',
	reader_id: 'APPLEBUILTINSIMULATOR-1',
	reader_model: 'COTS_DEVICE',
} );

function renderCharge(
	charge: Charge,
	metadata = {},
	isLoading = false,
	props = {}
) {
	const { container } = render(
		<PaymentDetailsSummary
			charge={ charge }
			metadata={ metadata }
			isLoading={ isLoading }
			{ ...props }
		/>
	);
	return container;
}

describe( 'PaymentDetailsSummary', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		global.wcpaySettings = {
			isSubscriptionsActive: false,
			zeroDecimalCurrencies: [],
			connect: {
				country: 'US',
			},
			featureFlags: {
				isAuthAndCaptureEnabled: true,
				isDisputeOnTransactionPageEnabled: false,
			},
			currencyData: {
				US: {
					code: 'USD',
					symbol: '$',
					symbolPosition: 'left',
					thousandSeparator: ',',
					decimalSeparator: '.',
					precision: 2,
				},
			},
		};

		// mock Date.now that moment library uses to get current date for testing purposes
		Date.now = jest.fn( () =>
			new Date( '2023-09-08T12:33:37.000Z' ).getTime()
		);
	} );

	afterEach( () => {
		Date.now = () => new Date().getTime();
	} );

	test( 'correctly renders a charge', () => {
		expect( renderCharge( getBaseCharge() ) ).toMatchSnapshot();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect( console ).toHaveWarnedWith(
			'List with items prop is deprecated is deprecated and will be removed in version 9.0.0. Note: See ExperimentalList / ExperimentalListItem for the new API that will replace this component in future versions.'
		);
	} );

	test( 'renders partially refunded information for a charge', () => {
		const charge = getBaseCharge();
		charge.refunded = false;
		charge.amount_refunded = 1200;
		charge.refunds?.data.push( {
			balance_transaction: {
				amount: -charge.amount_refunded,
				currency: 'usd',
			} as any,
		} );

		expect( renderCharge( charge ) ).toMatchSnapshot();
	} );

	test( 'renders fully refunded information for a charge', () => {
		const charge = getBaseCharge();
		charge.refunded = true;
		charge.amount_refunded = 2000;
		charge.refunds?.data.push( {
			balance_transaction: {
				amount: -charge.amount_refunded,
				currency: 'usd',
			} as any,
		} );

		expect( renderCharge( charge ) ).toMatchSnapshot();
	} );

	test( 'renders the information of a disputed charge', () => {
		const charge = getBaseCharge();
		charge.disputed = true;
		charge.dispute = getBaseDispute();
		charge.dispute.status = 'under_review';

		expect( renderCharge( charge ) ).toMatchSnapshot();
	} );

	test( 'renders the Tap to Pay channel from metadata', () => {
		const charge = getBaseCharge();
		const metadata = getBaseMetadata();

		expect( renderCharge( charge, metadata ) ).toMatchSnapshot();
	} );

	test( 'renders a charge with subscriptions', () => {
		global.wcpaySettings.isSubscriptionsActive = true;

		const charge = getBaseCharge();
		if ( charge.order ) {
			charge.order.subscriptions = [
				{
					number: 246,
					url: 'https://example.com/subscription/246',
				},
			];
		}

		expect( renderCharge( charge ) ).toMatchSnapshot();
	} );

	test( 'renders loading state', () => {
		expect( renderCharge( {} as any, true ) ).toMatchSnapshot();
	} );

	describe( 'capture notification and fraud buttons', () => {
		beforeAll( () => {
			// Mock current date and time to fixed value in moment
			const fixedCurrentDate = new Date( '2023-01-01T01:00:00.000Z' );
			jest.spyOn( Date, 'now' ).mockImplementation( () =>
				fixedCurrentDate.getTime()
			);
		} );

		afterAll( () => {
			jest.spyOn( Date, 'now' ).mockRestore();
		} );

		test( 'renders capture section correctly', () => {
			mockUseAuthorization.mockReturnValueOnce( {
				authorization: {
					captured: false,
					charge_id: 'ch_mock',
					amount: 1000,
					currency: 'usd',
					created: moment.utc().format(),
					order_id: 123,
					risk_level: 1,
					customer_country: 'US',
					customer_email: 'test@example.com',
					customer_name: 'Test Customer',
					payment_intent_id: 'pi_mock',
				},
				isLoading: false,
				isRequesting: false,
				doCaptureAuthorization: jest.fn(),
				doCancelAuthorization: jest.fn(),
			} );
			const charge = getBaseCharge();
			charge.captured = false;

			const container = renderCharge( charge );

			expect(
				screen.getByRole( 'button', { name: /Capture/i } )
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		test( 'renders the fraud outcome buttons', () => {
			mockUseAuthorization.mockReturnValueOnce( {
				authorization: {
					captured: false,
					charge_id: 'ch_mock',
					amount: 1000,
					currency: 'usd',
					created: new Date( Date.now() ).toISOString(),
					order_id: 123,
					risk_level: 1,
					customer_country: 'US',
					customer_email: 'test@example.com',
					customer_name: 'Test Customer',
					payment_intent_id: 'pi_mock',
				},
				isLoading: false,
				isRequesting: false,
				doCaptureAuthorization: jest.fn(),
				doCancelAuthorization: jest.fn(),
			} );
			const charge = getBaseCharge();
			charge.captured = false;

			const container = renderCharge( charge, {}, false, {
				paymentIntent: paymentIntentMock,
			} );

			expect(
				screen.getByRole( 'button', { name: /Approve Transaction/i } )
			).toBeInTheDocument();

			expect(
				screen.getByRole( 'button', { name: /Block Transaction/i } )
			).toBeInTheDocument();

			expect(
				screen.queryByRole( 'button', { name: /Capture/i } )
			).not.toBeInTheDocument();

			expect(
				screen.getByText(
					/Approving this transaction will capture the charge./
				)
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );
	} );

	describe( 'with feature flag isDisputeOnTransactionPageEnabled', () => {
		beforeEach( () => {
			global.wcpaySettings.featureFlags.isDisputeOnTransactionPageEnabled = true;
		} );

		afterEach( () => {
			global.wcpaySettings.featureFlags.isDisputeOnTransactionPageEnabled = false;
		} );

		test( 'renders the information of a disputed charge', () => {
			const charge = getBaseCharge();
			charge.disputed = true;
			charge.dispute = getBaseDispute();
			charge.dispute.status = 'needs_response';

			renderCharge( charge );

			// Dispute Notice
			screen.getByText(
				/The cardholder claims this is an unauthorized transaction/,
				{ ignore: '.a11y-speak-region' }
			);

			// Don't render the staged evidence message
			expect(
				screen.queryByText(
					/You initiated a challenge to this dispute/,
					{ ignore: '.a11y-speak-region' }
				)
			).toBeNull();

			// Dispute Summary Row
			expect(
				screen.getByText( /Dispute Amount/i ).nextSibling
			).toHaveTextContent( /\$20.00/ );
			expect(
				screen.getByText( /Disputed On/i ).nextSibling
			).toHaveTextContent( /Aug 30, 2023/ );
			expect(
				screen.getByText( /Reason/i ).nextSibling
			).toHaveTextContent( /Transaction unauthorized/ );
			expect(
				screen.getByText( /Respond By/i ).nextSibling
			).toHaveTextContent( /Sep 9, 2023/ );
		} );

		test( 'correctly renders dispute details for a dispute with staged evidence', () => {
			const charge = getBaseCharge();
			charge.disputed = true;
			charge.dispute = getBaseDispute();
			charge.dispute.status = 'needs_response';
			charge.dispute.evidence_details = {
				has_evidence: true,
				due_by: 1694303999,
				past_due: false,
				submission_count: 0,
			};

			renderCharge( charge );

			screen.getByText(
				/The cardholder claims this is an unauthorized transaction/,
				{ ignore: '.a11y-speak-region' }
			);

			// Render the staged evidence message
			screen.getByText( /You initiated a challenge to this dispute/, {
				ignore: '.a11y-speak-region',
			} );
		} );

		test( 'correctly renders dispute details for "won" disputes', () => {
			const charge = getBaseCharge();
			charge.disputed = true;
			charge.dispute = getBaseDispute();
			charge.dispute.status = 'won';
			charge.dispute.metadata.__evidence_submitted_at = '1693400000';
			renderCharge( charge );

			screen.getByText( /You won this dispute on/i, {
				ignore: '.a11y-speak-region',
			} );
			screen.getByRole( 'button', { name: /View dispute details/i } );
		} );

		test( 'correctly renders dispute details for "under_review" disputes', () => {
			const charge = getBaseCharge();
			charge.disputed = true;
			charge.dispute = getBaseDispute();
			charge.dispute.status = 'under_review';
			charge.dispute.metadata.__evidence_submitted_at = '1693400000';

			renderCharge( charge );

			screen.getByText( /reviewing the case/i, {
				ignore: '.a11y-speak-region',
			} );
			screen.getByRole( 'button', { name: /View submitted evidence/i } );
		} );

		test( 'correctly renders dispute details for "accepted" disputes', () => {
			const charge = getBaseCharge();
			charge.disputed = true;
			charge.dispute = getBaseDispute();
			charge.dispute.status = 'lost';
			charge.dispute.metadata.__closed_by_merchant = '1';
			charge.dispute.metadata.__dispute_closed_at = '1693453017';

			renderCharge( charge );

			screen.getByText( /This dispute was accepted/i, {
				ignore: '.a11y-speak-region',
			} );
			// Check for the correct fee amount
			screen.getByText( /\$15.00 fee/i, {
				ignore: '.a11y-speak-region',
			} );
		} );

		test( 'correctly renders dispute details for "lost" disputes', () => {
			const charge = getBaseCharge();
			charge.disputed = true;
			charge.dispute = getBaseDispute();
			charge.dispute.status = 'lost';
			charge.dispute.metadata.__evidence_submitted_at = '1693400000';
			charge.dispute.metadata.__dispute_closed_at = '1693453017';

			renderCharge( charge );

			screen.getByText( /This dispute was lost/i, {
				ignore: '.a11y-speak-region',
			} );
			// Check for the correct fee amount
			screen.getByText( /\$15.00 fee/i, {
				ignore: '.a11y-speak-region',
			} );
			screen.getByRole( 'button', { name: /View dispute details/i } );
		} );
	} );
} );
