import axios from "axios";
import { client } from "./cache"


const AUTH = 'emtfZGV2XzdjMDc4OTE1ZGVhODRiOGJhZTYxZTE3MDA1OTY0ZTBjOnprX2Rldl83YzA3ODkxNWRlYTg0YjhiYWU2MWUxNzAwNTk2NGUwYw==';

interface PortfolioData {
    links: {
        self: string;
    };
    data: {
        type: string;
        id: string;
        attributes: {
            positions_distribution_by_type: {
                [key: string]: number;
            };
            positions_distribution_by_chain: {
                [key: string]: number;
            };
            total: {
                positions: number;
            };
            changes: {
                absolute_1d: number;
                percent_1d: number;
            };
        };
    };
}

export async function fetchPortfolio(address: string): Promise<PortfolioData | null> {
    const options = {
        headers: {
            accept: "application/json",
            authorization:
            "Basic " + AUTH,
        },
    };
    
    try {
        const response = await axios.get<PortfolioData>(
            `https://api.zerion.io/v1/wallets/${address}/portfolio/`,
            options
            );
            return response.data;
        } catch (error) {
            
            return null;
        }
    }
    
    
    export async function getCachedPortfolio(address: string): Promise<PortfolioData | null> {
        const cacheKey = `portfolio:${address}`;
        
        try {
            const cachedData = await client.get(cacheKey);
            
            if (cachedData) {
                console.log("Using cached portfolio data");
                return JSON.parse(cachedData);
            }
            
            const portfolioData = await fetchPortfolio(address);
            
            if (portfolioData) {
                //@ts-ignore
                await client.set(cacheKey, JSON.stringify(portfolioData), "EX", 3600); // Set cache expiration to 1 hour (3600 seconds)
                return portfolioData;
            }
        } catch (error) {
            
            
            console.error("Error fetching cached portfolio data:");
        }
        
        return null;
    }