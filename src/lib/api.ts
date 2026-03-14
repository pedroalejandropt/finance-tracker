import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? 'demo';
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY ?? 'demo';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface ExchangeRateResponse {
  rates: { [key: string]: number };
  base: string;
}

export class StockAPI {
  static async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      const data = response.data;
      const quote = data['Global Quote'];

      if (!quote) {
        throw new Error('Stock not found');
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      };
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      // Return mock data for demo
      return {
        symbol,
        price: 150.0,
        change: 2.5,
        changePercent: 1.67,
      };
    } finally {
      await setTimeout(() => {}, 1000);
    }
  }

  static async searchStocks(query: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      return response.data.bestMatches || [];
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }
}

export class CurrencyAPI {
  static async getExchangeRates(base: string = 'USD'): Promise<ExchangeRateResponse> {
    try {
      const response = await axios.get(
        `https://open.er-api.com/v6/latest/${base}?apikey=${EXCHANGE_RATE_API_KEY}`
      );

      return {
        rates: response.data.rates,
        base: response.data.base_code,
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return mock data for demo with different base currencies
      if (base === 'USD') {
        return {
          rates: {
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110.0,
            CAD: 1.25,
            AUD: 1.35,
            CHF: 0.92,
            CNY: 6.45,
            INR: 74.0,
          },
          base: 'USD',
        };
      } else if (base === 'EUR') {
        return {
          rates: {
            USD: 1.18,
            GBP: 0.86,
            JPY: 129.4,
            CAD: 1.47,
            AUD: 1.59,
            CHF: 1.08,
            CNY: 7.59,
            INR: 87.1,
          },
          base: 'EUR',
        };
      } else {
        // Default fallback for other currencies
        return {
          rates: {
            USD: 1.0,
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110.0,
            CAD: 1.25,
            AUD: 1.35,
            CHF: 0.92,
            CNY: 6.45,
            INR: 74.0,
          },
          base: base,
        };
      }
    }
  }

  static async convertCurrency(from: string, to: string, amount: number): Promise<number> {
    if (from === to) return amount;

    try {
      const rates = await this.getExchangeRates(from);
      return amount * rates.rates[to];
    } catch (error) {
      console.error('Error converting currency:', error);
      // Return mock conversion
      const mockRates: { [key: string]: number } = {
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        INR: 74.0,
      };
      return amount * (mockRates[to] || 1);
    }
  }
}
