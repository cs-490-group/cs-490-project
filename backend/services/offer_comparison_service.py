"""
UC-127: Offer Evaluation & Comparison Service

Provides comprehensive offer evaluation including:
- Total compensation calculations
- Equity valuation
- Benefits monetary valuation
- Cost-of-living adjustments
- Scoring and comparison
- Scenario analysis
"""

from typing import Dict, List, Optional, Any
from mongo.offers_dao import offers_dao
import re


class OfferComparisonService:
    """Service for calculating and comparing job offers"""

    def __init__(self):
        self.offers_dao = offers_dao

    # ============================================
    # TOTAL COMPENSATION CALCULATION
    # ============================================

    async def calculate_total_compensation(self, offer_id: str, offer_data: dict) -> dict:
        """
        Calculate comprehensive total compensation breakdown

        Returns dict with:
        - year_1_total: First year total comp
        - annual_total: Ongoing annual comp (year 2+)
        - four_year_total: 4-year total comp
        """
        salary_details = offer_data.get("offered_salary_details", {})

        # Parse base salary
        base_salary = float(salary_details.get("base_salary", 0))

        # Parse signing bonus
        signing_bonus = float(salary_details.get("signing_bonus", 0))

        # Parse annual bonus (can be percentage or dollar range)
        annual_bonus_str = salary_details.get("annual_bonus", "")
        bonus_min, bonus_max, bonus_expected = self._parse_bonus(annual_bonus_str, base_salary)

        # Get equity values
        equity_details = salary_details.get("equity_details", {})
        year_1_equity = float(equity_details.get("year_1_value", 0))
        annual_equity = float(equity_details.get("annual_equity_value", 0))

        # Get benefits value
        benefits_val = salary_details.get("benefits_valuation", {})
        total_benefits = float(benefits_val.get("total_benefits_value", 0))

        # Calculate totals
        year_1_total = base_salary + signing_bonus + bonus_expected + year_1_equity + total_benefits
        annual_total = base_salary + bonus_expected + annual_equity + total_benefits
        four_year_total = year_1_total + (annual_total * 3)  # Year 1 + 3 more years

        total_comp = {
            "base_salary": base_salary,
            "signing_bonus": signing_bonus,
            "annual_bonus_min": bonus_min,
            "annual_bonus_max": bonus_max,
            "annual_bonus_expected": bonus_expected,
            "year_1_equity": year_1_equity,
            "annual_equity": annual_equity,
            "total_benefits": total_benefits,
            "year_1_total": year_1_total,
            "annual_total": annual_total,
            "four_year_total": four_year_total
        }

        # Save to database
        await self.offers_dao.update_compensation_calculation(offer_id, total_comp)

        return total_comp

    def _parse_bonus(self, bonus_str: str, base_salary: float) -> tuple:
        """
        Parse bonus string into min, max, expected values

        Examples:
        - "10-20%" -> (10% of base, 20% of base, 15% of base)
        - "$10k-$20k" -> (10000, 20000, 15000)
        - "15%" -> (15% of base, 15% of base, 15% of base)
        """
        if not bonus_str:
            return (0, 0, 0)

        bonus_str = bonus_str.strip()

        # Check for percentage range (e.g., "10-20%")
        percent_range_match = re.match(r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)%', bonus_str)
        if percent_range_match:
            min_pct = float(percent_range_match.group(1))
            max_pct = float(percent_range_match.group(2))
            min_val = base_salary * (min_pct / 100)
            max_val = base_salary * (max_pct / 100)
            expected_val = (min_val + max_val) / 2
            return (min_val, max_val, expected_val)

        # Check for single percentage (e.g., "15%")
        percent_match = re.match(r'(\d+\.?\d*)%', bonus_str)
        if percent_match:
            pct = float(percent_match.group(1))
            val = base_salary * (pct / 100)
            return (val, val, val)

        # Check for dollar range (e.g., "$10k-$20k" or "$10,000-$20,000")
        dollar_range_match = re.match(r'\$?([\d,]+)k?\s*-\s*\$?([\d,]+)k?', bonus_str, re.IGNORECASE)
        if dollar_range_match:
            min_str = dollar_range_match.group(1).replace(',', '')
            max_str = dollar_range_match.group(2).replace(',', '')

            # Check if 'k' suffix
            if 'k' in bonus_str.lower():
                min_val = float(min_str) * 1000
                max_val = float(max_str) * 1000
            else:
                min_val = float(min_str)
                max_val = float(max_str)

            expected_val = (min_val + max_val) / 2
            return (min_val, max_val, expected_val)

        # Check for single dollar value
        dollar_match = re.match(r'\$?([\d,]+)k?', bonus_str, re.IGNORECASE)
        if dollar_match:
            val_str = dollar_match.group(1).replace(',', '')
            if 'k' in bonus_str.lower():
                val = float(val_str) * 1000
            else:
                val = float(val_str)
            return (val, val, val)

        # Default
        return (0, 0, 0)

    # ============================================
    # EQUITY VALUATION
    # ============================================

    async def calculate_equity_value(self, offer_id: str, equity_data: dict) -> dict:
        """
        Calculate equity valuation based on type (RSUs vs Stock Options)

        equity_data should contain:
        - equity_type: "RSUs", "Stock Options", "ISO", "NSO"
        - number_of_shares: int
        - current_stock_price: float
        - strike_price: float (for options)
        - vesting_years: int
        - cliff_months: int
        """
        equity_type = equity_data.get("equity_type", "RSUs")
        num_shares = int(equity_data.get("number_of_shares", 0))
        stock_price = float(equity_data.get("current_stock_price", 0))
        strike_price = float(equity_data.get("strike_price", 0))
        vesting_years = int(equity_data.get("vesting_years", 4))
        cliff_months = int(equity_data.get("cliff_months", 12))

        if equity_type in ["RSUs", "Restricted Stock Units"]:
            # RSUs: full value of shares
            total_value = num_shares * stock_price

            # Year 1 vesting (typically 25% if 4-year vest with 1-year cliff)
            if cliff_months >= 12:
                year_1_value = total_value / vesting_years
            else:
                # Monthly vesting from start
                year_1_value = (num_shares / (vesting_years * 12)) * 12 * stock_price

            annual_equity = total_value / vesting_years

        elif equity_type in ["Stock Options", "ISO", "NSO"]:
            # Options: value is (current price - strike price) * shares
            # But only if current > strike (in the money)
            if stock_price > strike_price:
                value_per_share = stock_price - strike_price
                total_value = num_shares * value_per_share

                if cliff_months >= 12:
                    year_1_value = total_value / vesting_years
                else:
                    year_1_value = (num_shares / (vesting_years * 12)) * 12 * value_per_share

                annual_equity = total_value / vesting_years
            else:
                # Out of the money
                total_value = 0
                year_1_value = 0
                annual_equity = 0
        else:
            # Unknown type
            total_value = 0
            year_1_value = 0
            annual_equity = 0

        equity_details = {
            **equity_data,
            "estimated_value_at_vest": total_value,
            "year_1_value": year_1_value,
            "annual_equity_value": annual_equity
        }

        # Save to database
        await self.offers_dao.update_equity_details(offer_id, equity_details)

        return equity_details

    # ============================================
    # BENEFITS VALUATION
    # ============================================

    async def calculate_benefits_value(self, offer_id: str, benefits_data: dict, base_salary: float, pto_days: int = 0) -> dict:
        """
        Calculate monetary value of benefits

        benefits_data can include:
        - health_insurance_value
        - dental_vision_value
        - retirement_401k_match (percentage or dollar amount)
        - life_insurance_value
        - disability_insurance_value
        - hsa_contribution
        - commuter_benefits
        - education_stipend
        - wellness_stipend
        - home_office_stipend
        """
        health = float(benefits_data.get("health_insurance_value", 0))
        dental_vision = float(benefits_data.get("dental_vision_value", 0))
        life = float(benefits_data.get("life_insurance_value", 0))
        disability = float(benefits_data.get("disability_insurance_value", 0))
        hsa = float(benefits_data.get("hsa_contribution", 0))
        commuter = float(benefits_data.get("commuter_benefits", 0))
        education = float(benefits_data.get("education_stipend", 0))
        wellness = float(benefits_data.get("wellness_stipend", 0))
        home_office = float(benefits_data.get("home_office_stipend", 0))

        # Calculate 401k match
        retirement_str = benefits_data.get("retirement_401k_match", "0")
        if isinstance(retirement_str, str) and '%' in retirement_str:
            # Parse percentage (e.g., "6%")
            match_pct = float(retirement_str.replace('%', '').strip())
            retirement_match = base_salary * (match_pct / 100)
        else:
            retirement_match = float(retirement_str)

        # Calculate PTO monetary value
        # Assume 260 working days per year (52 weeks * 5 days)
        daily_rate = base_salary / 260
        pto_value = daily_rate * pto_days

        # Total
        total = (health + dental_vision + retirement_match + life + disability +
                 hsa + commuter + education + wellness + home_office + pto_value)

        benefits_valuation = {
            **benefits_data,
            "retirement_401k_match": retirement_match,
            "pto_monetary_value": pto_value,
            "total_benefits_value": total
        }

        # Save to database
        await self.offers_dao.update_benefits_valuation(offer_id, benefits_valuation)

        return benefits_valuation

    # ============================================
    # COST OF LIVING ADJUSTMENT
    # ============================================

    async def calculate_cost_of_living_adjustment(self, offer_id: str, location: str, base_salary: float) -> dict:
        """
        Calculate cost-of-living adjusted salary

        Note: In production, this would integrate with external APIs.
        For now, we use static estimates.
        """
        # Static COL indices (100 = national average)
        COL_INDICES = {
            "San Francisco, CA": 180,
            "New York, NY": 170,
            "Seattle, WA": 140,
            "Austin, TX": 110,
            "Denver, CO": 115,
            "Chicago, IL": 120,
            "Boston, MA": 145,
            "Los Angeles, CA": 150,
            "Portland, OR": 130,
            "Phoenix, AZ": 105,
            "Atlanta, GA": 110,
            "Miami, FL": 120,
            "Dallas, TX": 105,
            "Philadelphia, PA": 120,
            "San Diego, CA": 145,
            # Default
            "Remote": 100,
            "Other": 100
        }

        # Tax rates (federal + state effective rates)
        TAX_RATES = {
            "San Francisco, CA": 0.35,  # CA has high state tax
            "New York, NY": 0.33,
            "Seattle, WA": 0.25,  # WA has no state income tax
            "Austin, TX": 0.24,  # TX has no state income tax
            "Denver, CO": 0.28,
            "Chicago, IL": 0.29,
            "Boston, MA": 0.30,
            "Los Angeles, CA": 0.35,
            "Portland, OR": 0.32,
            "Phoenix, AZ": 0.27,
            "Atlanta, GA": 0.29,
            "Miami, FL": 0.24,  # FL has no state income tax
            "Dallas, TX": 0.24,
            "Philadelphia, PA": 0.30,
            "San Diego, CA": 0.35,
            "Remote": 0.28,
            "Other": 0.28
        }

        col_index = COL_INDICES.get(location, 100)
        tax_rate = TAX_RATES.get(location, 0.28)

        # Adjusted salary = base_salary * (100 / col_index)
        # This shows what the salary is "worth" relative to national average
        adjusted_salary = base_salary * (100 / col_index)

        col_data = {
            "location": location,
            "col_index": col_index,
            "tax_rate": tax_rate,
            "adjusted_salary": adjusted_salary
        }

        # Save to database
        await self.offers_dao.update_cost_of_living(offer_id, col_data)

        return col_data

    # ============================================
    # OFFER SCORING
    # ============================================

    async def calculate_offer_score(
        self,
        offer_id: str,
        total_comp: dict,
        non_financial_factors: dict,
        market_median: Optional[float] = None,
        weights: Optional[dict] = None
    ) -> dict:
        """
        Calculate comprehensive offer score

        Financial Score (0-100): Based on total comp vs market
        Non-Financial Score (0-100): Average of factor ratings (1-10 scale)
        Weighted Total: Combines both using user weights
        """
        # Financial score
        if market_median and market_median > 0:
            # Score based on how far above/below market
            comp_ratio = total_comp.get("annual_total", 0) / market_median
            if comp_ratio >= 1.2:
                financial_score = 100
            elif comp_ratio >= 1.1:
                financial_score = 90
            elif comp_ratio >= 1.0:
                financial_score = 80
            elif comp_ratio >= 0.95:
                financial_score = 70
            elif comp_ratio >= 0.9:
                financial_score = 60
            else:
                financial_score = max(0, 50 * comp_ratio / 0.9)

            percentile = min(99, (comp_ratio - 0.5) * 100)
        else:
            # No market data, use absolute comp
            annual_total = total_comp.get("annual_total", 0)
            if annual_total >= 300000:
                financial_score = 100
            elif annual_total >= 200000:
                financial_score = 85
            elif annual_total >= 150000:
                financial_score = 70
            elif annual_total >= 100000:
                financial_score = 55
            else:
                financial_score = max(0, (annual_total / 100000) * 55)

            percentile = None

        # Non-financial score (average of all factors on 1-10 scale, converted to 0-100)
        factors = [
            non_financial_factors.get("culture_fit", 0),
            non_financial_factors.get("growth_opportunities", 0),
            non_financial_factors.get("work_life_balance", 0),
            non_financial_factors.get("team_quality", 0),
            non_financial_factors.get("mission_alignment", 0),
            non_financial_factors.get("commute_quality", 0),
            non_financial_factors.get("job_security", 0),
            non_financial_factors.get("learning_opportunities", 0)
        ]

        valid_factors = [f for f in factors if f > 0]
        if valid_factors:
            avg_factor = sum(valid_factors) / len(valid_factors)
            non_financial_score = (avg_factor / 10) * 100
        else:
            non_financial_score = 0

        # Weighted total score
        if weights:
            financial_weight = weights.get("financial_weight", 0.6)
            non_financial_weight = 1.0 - financial_weight
        else:
            financial_weight = 0.6
            non_financial_weight = 0.4

        weighted_total = (financial_score * financial_weight) + (non_financial_score * non_financial_weight)

        # Recommendation
        if weighted_total >= 85:
            recommendation = "Strong Accept"
        elif weighted_total >= 70:
            recommendation = "Accept"
        elif weighted_total >= 55:
            recommendation = "Negotiate"
        else:
            recommendation = "Consider Declining"

        score = {
            "financial_score": round(financial_score, 2),
            "non_financial_score": round(non_financial_score, 2),
            "weighted_total_score": round(weighted_total, 2),
            "percentile_vs_market": round(percentile, 2) if percentile else None,
            "recommendation": recommendation
        }

        # Save to database
        await self.offers_dao.update_offer_score(offer_id, score)

        return score

    # ============================================
    # SCENARIO ANALYSIS
    # ============================================

    async def run_scenario_analysis(self, offer_id: str, scenarios: List[dict]) -> List[dict]:
        """
        Run "what-if" scenarios on an offer

        Each scenario should contain changes to apply:
        {
            "name": "Negotiate 10% higher salary",
            "changes": {
                "base_salary": 165000  # vs original 150000
            }
        }

        Returns list of scenarios with recalculated total comp
        """
        # Get original offer
        offer = await self.offers_dao.get_offer(offer_id)
        if not offer:
            return []

        results = []

        for scenario in scenarios:
            scenario_name = scenario.get("name", "Scenario")
            changes = scenario.get("changes", {})

            # Create modified offer data
            modified_offer = {**offer}
            salary_details = modified_offer.get("offered_salary_details", {})

            # Apply changes
            for key, value in changes.items():
                if key in ["base_salary", "signing_bonus", "annual_bonus", "pto_days"]:
                    salary_details[key] = value
                elif key.startswith("equity_"):
                    if "equity_details" not in salary_details:
                        salary_details["equity_details"] = {}
                    equity_key = key.replace("equity_", "")
                    salary_details["equity_details"][equity_key] = value
                elif key.startswith("benefits_"):
                    if "benefits_valuation" not in salary_details:
                        salary_details["benefits_valuation"] = {}
                    benefits_key = key.replace("benefits_", "")
                    salary_details["benefits_valuation"][benefits_key] = value

            modified_offer["offered_salary_details"] = salary_details

            # Recalculate (without saving to DB)
            temp_comp = await self._calculate_total_comp_without_saving(modified_offer)

            results.append({
                "scenario_name": scenario_name,
                "changes": changes,
                "total_compensation": temp_comp
            })

        return results

    async def _calculate_total_comp_without_saving(self, offer_data: dict) -> dict:
        """Helper to calculate total comp without saving to DB"""
        salary_details = offer_data.get("offered_salary_details", {})

        base_salary = float(salary_details.get("base_salary", 0))
        signing_bonus = float(salary_details.get("signing_bonus", 0))

        annual_bonus_str = salary_details.get("annual_bonus", "")
        bonus_min, bonus_max, bonus_expected = self._parse_bonus(annual_bonus_str, base_salary)

        equity_details = salary_details.get("equity_details", {})
        year_1_equity = float(equity_details.get("year_1_value", 0))
        annual_equity = float(equity_details.get("annual_equity_value", 0))

        benefits_val = salary_details.get("benefits_valuation", {})
        total_benefits = float(benefits_val.get("total_benefits_value", 0))

        year_1_total = base_salary + signing_bonus + bonus_expected + year_1_equity + total_benefits
        annual_total = base_salary + bonus_expected + annual_equity + total_benefits
        four_year_total = year_1_total + (annual_total * 3)

        return {
            "base_salary": base_salary,
            "signing_bonus": signing_bonus,
            "annual_bonus_expected": bonus_expected,
            "year_1_equity": year_1_equity,
            "annual_equity": annual_equity,
            "total_benefits": total_benefits,
            "year_1_total": year_1_total,
            "annual_total": annual_total,
            "four_year_total": four_year_total
        }

    # ============================================
    # SIDE-BY-SIDE COMPARISON
    # ============================================

    async def compare_offers(self, offer_ids: List[str], weights: Optional[dict] = None) -> dict:
        """
        Get side-by-side comparison of multiple offers

        Returns:
        - offers: List of offer details with scores
        - winner: Offer with highest weighted score
        - comparison_matrix: Side-by-side breakdown
        """
        offers = await self.offers_dao.get_offers_for_comparison(offer_ids)

        if not offers:
            return {"offers": [], "winner": None, "comparison_matrix": {}}

        # Build comparison matrix
        comparison_data = []

        for offer in offers:
            offer_id = str(offer.get("_id"))
            comp = offer.get("offered_salary_details", {}).get("total_compensation", {})
            score = offer.get("offer_score", {})

            comparison_data.append({
                "offer_id": offer_id,
                "company": offer.get("company"),
                "job_title": offer.get("job_title"),
                "location": offer.get("location"),
                "base_salary": comp.get("base_salary", 0),
                "year_1_total": comp.get("year_1_total", 0),
                "annual_total": comp.get("annual_total", 0),
                "four_year_total": comp.get("four_year_total", 0),
                "financial_score": score.get("financial_score", 0),
                "non_financial_score": score.get("non_financial_score", 0),
                "weighted_total_score": score.get("weighted_total_score", 0),
                "recommendation": score.get("recommendation", "N/A")
            })

        # Find winner (highest weighted score)
        winner = max(comparison_data, key=lambda x: x.get("weighted_total_score", 0))

        return {
            "offers": comparison_data,
            "winner": winner,
            "comparison_matrix": self._build_matrix(comparison_data)
        }

    def _build_matrix(self, comparison_data: List[dict]) -> dict:
        """Build side-by-side comparison matrix"""
        companies = [o["company"] for o in comparison_data]

        matrix = {
            "companies": companies,
            "base_salary": [o["base_salary"] for o in comparison_data],
            "year_1_total": [o["year_1_total"] for o in comparison_data],
            "annual_total": [o["annual_total"] for o in comparison_data],
            "four_year_total": [o["four_year_total"] for o in comparison_data],
            "financial_score": [o["financial_score"] for o in comparison_data],
            "non_financial_score": [o["non_financial_score"] for o in comparison_data],
            "weighted_total_score": [o["weighted_total_score"] for o in comparison_data],
            "recommendation": [o["recommendation"] for o in comparison_data]
        }

        return matrix


# Singleton instance
offer_comparison_service = OfferComparisonService()
