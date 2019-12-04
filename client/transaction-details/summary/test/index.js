/** @format */
/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import TransactionSummaryDetails from '../';

const getBaseTransaction = () => ( {
	id: 'txn_38jdHA39KKA',
	/* Stripe data comes in seconds, instead of the default Date miliseconds */
	created: Date.parse( 'Sep 19, 2019, 5:24 pm' ) / 1000,
	amount: 1500,
	fee: 74,
	net: 1426,
	currency: 'usd',
	type: 'charge',
	order: {
		number: 45981,
		url: 'https://somerandomorderurl.com/?edit_order=45981',
	},
	source: {
		// eslint-disable-next-line camelcase
		billing_details: {
			name: 'Customer Name',
		},
		// eslint-disable-next-line camelcase
		payment_method_details: {
			card: {
				brand: 'visa',
				last4: '4242',
			},
			type: 'card',
		},
		outcome: {
			// eslint-disable-next-line camelcase
			risk_level: 'normal',
		},
	},
} );

describe( 'TransactionSummaryDetails', () => {
	test( 'correctly renders a transaction', () => {
		const transactionSummaryDetails = renderTransaction( getBaseTransaction() );
		expect( transactionSummaryDetails ).toMatchSnapshot();
	} );

	test( 'renders partially refunded information for a transaction', () => {
		const transaction = getBaseTransaction();
		transaction.source.refunded = false;
		// eslint-disable-next-line camelcase
		transaction.source.amount_refunded = 1200;

		const transactionSummaryDetails = renderTransaction( transaction );
		expect( transactionSummaryDetails ).toMatchSnapshot();
	} );

	test( 'renders fully refunded information for a transaction', () => {
		const transaction = getBaseTransaction();
		transaction.source.refunded = true;
		// eslint-disable-next-line camelcase
		transaction.source.amount_refunded = 1500;

		const transactionSummaryDetails = renderTransaction( transaction );
		expect( transactionSummaryDetails ).toMatchSnapshot();
	} );

	test( 'renders defaults if transaction object is empty', () => {
		const transactionSummaryDetails = renderTransaction( {} );
		expect( transactionSummaryDetails ).toMatchSnapshot();
	} );

	function renderTransaction( transaction ) {
		return shallow( <TransactionSummaryDetails transaction={ transaction } /> );
	}
} );

