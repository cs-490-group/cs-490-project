from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import statistics

from mongo.network_dao import network_dao
from mongo.network_events_dao import network_events_dao
from mongo.network_analytics_dao import network_analytics_dao
from mongo.referrals_dao import referrals_dao
from mongo.jobs_dao import jobs_dao
from mongo.offers_dao import offers_dao
from mongo.informational_interviews_dao import informational_interviews_dao
from mongo.professional_references_dao import professional_references_dao
from mongo.mentorship_dao import mentorship_dao
from schema.EnhancedNetwork import (
    NetworkingAnalytics, 
    RelationshipStrength, 
    EngagementQuality,
    NetworkingEventType,
    ROIMetricType
)

class NetworkingAnalyticsService:
    """Comprehensive networking analytics service"""
    
    def __init__(self):
        self.industry_benchmarks = self._load_industry_benchmarks()

    def _parse_datetime(self, value: Any) -> Optional[datetime]:
        """Safely parse a datetime value that may be stored as a datetime or ISO string.

        Supports:
        - timezone-aware or naive datetime objects
        - ISO strings, with optional trailing 'Z'
        - date-only strings (YYYY-MM-DD)
        """
        if value is None:
            return None

        if isinstance(value, datetime):
            # Ensure timezone-aware, default to UTC if naive
            if value.tzinfo is None:
                return value.replace(tzinfo=timezone.utc)
            return value

        if isinstance(value, str):
            text = value.strip()
            try:
                # Replace trailing Z with UTC offset for fromisoformat
                if text.endswith("Z"):
                    text = text.replace("Z", "+00:00")
                # If date only, append midnight
                if len(text) == 10 and "T" not in text:
                    text = text + "T00:00:00+00:00"
                dt = datetime.fromisoformat(text)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except Exception:
                return None

        return None

    def _normalize_relationship_strength(self, value: Any) -> RelationshipStrength:
        """Map raw relationship_strength values from contacts to RelationshipStrength enum."""
        if isinstance(value, RelationshipStrength):
            return value

        if isinstance(value, str):
            lowered = value.lower()
            if lowered == "strong":
                return RelationshipStrength.STRONG
            if lowered == "moderate":
                return RelationshipStrength.MODERATE
            if lowered == "weak":
                return RelationshipStrength.WEAK
            if lowered in {"new", ""}:
                return RelationshipStrength.NEW
            # Anything else treat as dormant/low-engagement
            return RelationshipStrength.DORMANT

        # Default when missing
        return RelationshipStrength.NEW
    
    def _load_industry_benchmarks(self) -> Dict:
        """Load industry benchmarks for networking performance"""
        return {
            "tech": {
                "avg_networking_activities_per_month": 8,
                "avg_referral_rate": 0.15,
                "avg_event_roi": 2.5,
                "avg_relationship_strength_score": 6.8,
                "avg_response_rate": 45.0
            },
            "finance": {
                "avg_networking_activities_per_month": 12,
                "avg_referral_rate": 0.25,
                "avg_event_roi": 3.8,
                "avg_relationship_strength_score": 7.2,
                "avg_response_rate": 52.0
            },
            "healthcare": {
                "avg_networking_activities_per_month": 6,
                "avg_referral_rate": 0.12,
                "avg_event_roi": 2.1,
                "avg_relationship_strength_score": 6.5,
                "avg_response_rate": 38.0
            },
            "consulting": {
                "avg_networking_activities_per_month": 15,
                "avg_referral_rate": 0.30,
                "avg_event_roi": 4.2,
                "avg_relationship_strength_score": 7.8,
                "avg_response_rate": 58.0
            }
        }
    
    async def generate_comprehensive_analytics(
        self, 
        user_uuid: str, 
        period_start: datetime,
        period_end: datetime,
        industry: Optional[str] = "tech"
    ) -> NetworkingAnalytics:
        """Generate comprehensive networking analytics for a user"""
        
        try:
            # Get all networking data for the period
            contacts = await network_dao.get_all_contacts(user_uuid) or []
            events = await network_events_dao.get_events_by_date_range(
                user_uuid, 
                period_start.isoformat(), 
                period_end.isoformat()
            ) or []
            referrals = await referrals_dao.get_all_referrals(user_uuid) or []
            jobs = await jobs_dao.get_all_jobs(user_uuid) or []
            offers = await offers_dao.get_user_offers(user_uuid) or []
            interviews = await informational_interviews_dao.get_all_interviews(user_uuid) or []
            
            # Calculate basic metrics
            total_activities = len(events)
            total_contacts_made = sum(event.get("actual_contacts_made", 0) for event in events) if events else 0
            quality_conversations = sum(event.get("quality_conversations", 0) for event in events) if events else 0
            
            # Calculate ROI
            roi_data = await self._calculate_roi(user_uuid, events, jobs, offers, referrals)
            
            # Relationship analytics
            relationship_data = self._analyze_relationships(contacts, period_start, period_end)
            
            # Engagement analytics
            engagement_data = self._calculate_engagement_metrics(contacts, events)
            
            # Opportunity analytics
            opportunity_data = await self._analyze_opportunities(
                referrals, jobs, offers, interviews, events
            )
            
            # Event ROI analysis
            event_roi_data = self._analyze_event_roi(events, roi_data)
            
            # Get industry benchmarks
            benchmark = self.industry_benchmarks.get(industry, self.industry_benchmarks["tech"])
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                relationship_data, engagement_data, opportunity_data, event_roi_data, benchmark
            )
            
            # Compute average satisfaction only over events that actually have a score
            satisfaction_scores = [
                event.get("satisfaction_score", 5)
                for event in events
                if event.get("satisfaction_score") is not None
            ]

            return NetworkingAnalytics(
                analytics_period=f"{period_start.strftime('%Y-%m-%d')} to {period_end.strftime('%Y-%m-%d')}",
                total_networking_activities=total_activities,
                total_contacts_made=total_contacts_made,
                quality_conversations_ratio=quality_conversations / max(total_contacts_made, 1),
                average_event_satisfaction=statistics.mean(satisfaction_scores) if satisfaction_scores else 0,
                total_investment=roi_data["total_investment"],
                total_roi_value=roi_data["total_value"],
                roi_percentage=roi_data["roi_percentage"],
                
                # Relationship analytics
                new_relationships=relationship_data["new_relationships"],
                strengthened_relationships=relationship_data["strengthened_relationships"],
                relationship_strength_distribution=relationship_data["strength_distribution"],
                average_trust_score=relationship_data["average_trust_score"],
                high_value_relationships=relationship_data["high_value_relationships"],
                
                # Engagement analytics
                average_response_rate=engagement_data["average_response_rate"],
                follow_up_completion_rate=engagement_data["follow_up_completion_rate"],
                interaction_frequency_trend=engagement_data["interaction_frequency_trend"],
                
                # Opportunity analytics
                referrals_generated=opportunity_data["referrals_generated"],
                interviews_from_networking=opportunity_data["interviews_from_networking"],
                offers_from_networking=opportunity_data["offers_from_networking"],
                accepted_offers_from_networking=opportunity_data["accepted_offers_from_networking"],
                opportunities_by_event_type=opportunity_data["opportunities_by_event_type"],
                
                # ROI analytics
                event_roi_by_type=event_roi_data["event_roi_by_type"],
                most_profitable_event_types=event_roi_data["most_profitable_event_types"],
                cost_per_opportunity=roi_data["cost_per_opportunity"],
                time_to_opportunity=roi_data["time_to_opportunity"],
                best_conversion_channels=event_roi_data["best_conversion_channels"],
                
                # Industry benchmarks
                industry_benchmarks=benchmark,
                improvement_recommendations=recommendations
            )
        except Exception as e:
            # Log error and return minimal analytics for new users
            print(f"Error generating comprehensive analytics for {user_uuid}: {str(e)}")
            # Return a default analytics object with zeros for new users
            benchmark = self.industry_benchmarks.get(industry, self.industry_benchmarks["tech"])
            return NetworkingAnalytics(
                analytics_period=f"{period_start.strftime('%Y-%m-%d')} to {period_end.strftime('%Y-%m-%d')}",
                total_networking_activities=0,
                total_contacts_made=0,
                quality_conversations_ratio=0,
                average_event_satisfaction=0,
                total_investment=0,
                total_roi_value=0,
                roi_percentage=0,
                new_relationships=0,
                strengthened_relationships=0,
                relationship_strength_distribution={strength: 0 for strength in RelationshipStrength},
                average_trust_score=0,
                high_value_relationships=0,
                average_response_rate=0,
                follow_up_completion_rate=0,
                interaction_frequency_trend="stable",
                referrals_generated=0,
                interviews_from_networking=0,
                offers_from_networking=0,
                accepted_offers_from_networking=0,
                opportunities_by_event_type={event_type: 0 for event_type in NetworkingEventType},
                event_roi_by_type={event_type: 0 for event_type in NetworkingEventType},
                most_profitable_event_types=[],
                cost_per_opportunity=0,
                time_to_opportunity=0,
                best_conversion_channels=[],
                industry_benchmarks=benchmark,
                improvement_recommendations=["Start by adding networking events to track your activities"]
            )
    
    async def _calculate_roi(
        self, 
        user_uuid: str, 
        events: List[Dict], 
        jobs: List[Dict], 
        offers: List[Dict],
        referrals: List[Dict]
    ) -> Dict:
        """Calculate return on investment for networking activities"""
        
        # Calculate total investment (time + money)
        total_time_hours = sum(
            event.get("preparation_time_hours", 0) + (event.get("event_duration_minutes", 0) / 60)
            for event in events
        )
        total_money = sum(event.get("cost", 0) for event in events)
        
        # Value time at $50/hour for opportunity cost
        time_value = total_time_hours * 50
        total_investment = total_money + time_value
        
        # Calculate returns from jobs and offers
        total_value = 0
        opportunities_count = 0
        
        for job in jobs:
            # Check if job came from networking
            if self._is_networking_sourced(job, events, referrals):
                # Estimate value based on salary
                estimated_salary = job.get("salary_range", {}).get("max", 80000)
                total_value += estimated_salary * 0.1  # 10% of annual salary as opportunity value
                opportunities_count += 1
        
        for offer in offers:
            if self._is_networking_sourced(offer, events, referrals):
                salary = offer.get("salary", 0)
                total_value += salary * 0.15  # 15% of offer value
                opportunities_count += 1
        
        # Calculate ROI percentage
        roi_percentage = ((total_value - total_investment) / total_investment * 100) if total_investment > 0 else 0
        
        # Calculate cost per opportunity
        cost_per_opportunity = total_investment / opportunities_count if opportunities_count > 0 else 0
        
        # Calculate average time to opportunity
        time_to_opportunity = self._calculate_time_to_opportunity(events, jobs, offers)
        
        return {
            "total_investment": total_investment,
            "total_value": total_value,
            "roi_percentage": roi_percentage,
            "cost_per_opportunity": cost_per_opportunity,
            "time_to_opportunity": time_to_opportunity,
            "total_time_hours": total_time_hours,
            "total_money": total_money
        }
    
    def _is_networking_sourced(
        self, 
        item: Dict, 
        events: List[Dict], 
        referrals: List[Dict]
    ) -> bool:
        """Determine if a job/offer came from networking activities"""
        
        # Check for direct referral indicators
        if item.get("source") == "referral" or item.get("referral_id"):
            return True
        
        # Check if company matches any event target companies
        item_company = item.get("company", "").lower()
        for event in events:
            target_companies = event.get("target_companies", [])
            if item_company in [tc.lower() for tc in target_companies]:
                return True
        
        # Check referral dates vs event dates
        item_date = item.get("date_created")
        if item_date:
            for event in events:
                event_date = event.get("event_date")
                if event_date and self._dates_within_range(item_date, event_date, 30):
                    return True
        
        return False
    
    def _dates_within_range(self, date1: str, date2: str, days: int) -> bool:
        """Check if two dates are within specified days of each other"""
        d1 = self._parse_datetime(date1)
        d2 = self._parse_datetime(date2)
        if not d1 or not d2:
            return False
        return abs((d1 - d2).days) <= days
    
    def _calculate_time_to_opportunity(
        self, 
        events: List[Dict], 
        jobs: List[Dict], 
        offers: List[Dict]
    ) -> int:
        """Calculate average time from networking event to opportunity"""
        
        times = []
        
        for job in jobs:
            if job.get("date_created"):
                job_date = self._parse_datetime(job["date_created"])
                if not job_date:
                    continue
                
                # Find closest preceding event
                for event in events:
                    if event.get("event_date"):
                        event_date = self._parse_datetime(event["event_date"])
                        if not event_date:
                            continue
                        if event_date < job_date:
                            times.append((job_date - event_date).days)
                            break
        
        return int(statistics.mean(times)) if times else 0
    
    def _analyze_relationships(
        self, 
        contacts: List[Dict], 
        period_start: datetime, 
        period_end: datetime
    ) -> Dict:
        """Analyze relationship strength and development"""
        
        strength_distribution = {strength: 0 for strength in RelationshipStrength}
        new_relationships = 0
        strengthened_relationships = 0
        trust_scores = []
        high_value_count = 0
        
        if not contacts:
            return {
                "new_relationships": 0,
                "strengthened_relationships": 0,
                "strength_distribution": strength_distribution,
                "average_trust_score": 0,
                "high_value_relationships": 0
            }
        
        for contact in contacts:
            # Count relationship strengths
            raw_strength = contact.get("relationship_strength", RelationshipStrength.NEW)
            strength = self._normalize_relationship_strength(raw_strength)
            strength_distribution[strength] += 1
            
            # Count high-value relationships
            trust_score = contact.get("trust_score", 0)
            if trust_score:
                trust_scores.append(trust_score)
            if trust_score >= 8:
                high_value_count += 1
            
            # Check if relationship is new (created in period)
            created_date = contact.get("date_created")
            if created_date:
                contact_date = self._parse_datetime(created_date)
                if contact_date and period_start <= contact_date <= period_end:
                    new_relationships += 1
            
            # Check if relationship was strengthened
            updated_date = contact.get("date_updated")
            if updated_date and updated_date != created_date:
                update_date = self._parse_datetime(updated_date)
                if update_date and period_start <= update_date <= period_end:
                    strengthened_relationships += 1
        
        return {
            "new_relationships": new_relationships,
            "strengthened_relationships": strengthened_relationships,
            "strength_distribution": strength_distribution,
            "average_trust_score": statistics.mean(trust_scores) if trust_scores else 0,
            "high_value_relationships": high_value_count
        }
    
    def _calculate_engagement_metrics(
        self, 
        contacts: List[Dict], 
        events: List[Dict]
    ) -> Dict:
        """Calculate engagement quality metrics"""
        
        response_rates = []
        follow_up_completed = 0
        follow_up_required = 0
        
        for contact in contacts:
            response_rate = contact.get("response_rate", 0)
            response_rates.append(response_rate)
        
        for event in events:
            follow_up_required += event.get("follow_up_actions_required", 0)
            follow_up_completed += event.get("follow_up_actions_completed", 0)
        
        # Calculate interaction frequency trend
        # This would require historical data - simplified for now
        interaction_frequency_trend = "stable"  # Would analyze month-over-month changes
        
        return {
            "average_response_rate": statistics.mean(response_rates) if response_rates else 0,
            "follow_up_completion_rate": follow_up_completed / max(follow_up_required, 1),
            "interaction_frequency_trend": interaction_frequency_trend
        }
    
    async def _analyze_opportunities(
        self,
        referrals: List[Dict],
        jobs: List[Dict],
        offers: List[Dict],
        interviews: List[Dict],
        events: List[Dict]
    ) -> Dict:
        """Analyze opportunity generation from networking"""
        
        # Count opportunities by type
        referrals_generated = len([r for r in referrals if r.get("date_created")])
        
        interviews_from_networking = len([
            i for i in interviews 
            if self._is_networking_sourced(i, events, referrals)
        ])
        
        offers_from_networking = len([
            o for o in offers 
            if self._is_networking_sourced(o, events, referrals)
        ])
        
        accepted_offers_from_networking = len([
            o for o in offers 
            if self._is_networking_sourced(o, events, referrals) and o.get("status") == "accepted"
        ])
        
        # Analyze opportunities by event type
        opportunities_by_event_type = {event_type: 0 for event_type in NetworkingEventType}
        
        for event in events:
            raw_type = event.get("event_type")
            if not raw_type:
                continue

            # Normalize string to NetworkingEventType enum; default to OTHER if unknown
            try:
                event_type = (
                    raw_type
                    if isinstance(raw_type, NetworkingEventType)
                    else NetworkingEventType(raw_type)
                )
            except ValueError:
                event_type = NetworkingEventType.OTHER

            # Count opportunities from this event type
            event_opportunities = self._count_event_opportunities(event, jobs, offers, referrals)
            opportunities_by_event_type[event_type] += event_opportunities
        
        return {
            "referrals_generated": referrals_generated,
            "interviews_from_networking": interviews_from_networking,
            "offers_from_networking": offers_from_networking,
            "accepted_offers_from_networking": accepted_offers_from_networking,
            "opportunities_by_event_type": opportunities_by_event_type
        }
    
    def _count_event_opportunities(
        self, 
        event: Dict, 
        jobs: List[Dict], 
        offers: List[Dict], 
        referrals: List[Dict]
    ) -> int:
        """Count opportunities generated from a specific event"""
        
        event_date = event.get("event_date")
        if not event_date:
            return 0
        
        opportunities = 0
        event_datetime = self._parse_datetime(event_date)
        if not event_datetime:
            return 0
        
        # Check for opportunities within 30 days of event
        for job in jobs:
            if job.get("date_created"):
                job_date = self._parse_datetime(job["date_created"])
                if not job_date:
                    continue
                if 0 <= (job_date - event_datetime).days <= 30:
                    if self._is_networking_sourced(job, [event], referrals):
                        opportunities += 1
        
        return opportunities
    
    def _analyze_event_roi(self, events: List[Dict], roi_data: Dict) -> Dict:
        """Analyze ROI by event type"""
        
        event_roi_by_type = {event_type: 0 for event_type in NetworkingEventType}
        event_costs_by_type = {event_type: 0 for event_type in NetworkingEventType}
        event_count_by_type = {event_type: 0 for event_type in NetworkingEventType}
        
        if not events:
            return {
                "event_roi_by_type": event_roi_by_type,
                "most_profitable_event_types": [],
                "best_conversion_channels": ["coffee_chat", "informational_interview", "networking_event"]
            }
        
        for event in events:
            raw_type = event.get("event_type")
            if not raw_type:
                continue

            try:
                event_type = (
                    raw_type
                    if isinstance(raw_type, NetworkingEventType)
                    else NetworkingEventType(raw_type)
                )
            except ValueError:
                event_type = NetworkingEventType.OTHER

            cost = event.get("cost", 0) + (event.get("preparation_time_hours", 0) * 50)
            event_costs_by_type[event_type] += cost
            event_count_by_type[event_type] += 1
        
        # Calculate ROI for each event type
        total_value = roi_data.get("total_value", 0)
        total_cost = roi_data.get("total_investment", 1)  # Default to 1 to avoid division by zero
        
        if total_cost > 0:
            for event_type in NetworkingEventType:
                type_cost = event_costs_by_type[event_type]
                if type_cost > 0:
                    # Assume value is proportional to cost for this calculation
                    type_value = (type_cost / total_cost) * total_value if total_cost > 0 else 0
                    event_roi_by_type[event_type] = ((type_value - type_cost) / type_cost) * 100 if type_cost > 0 else 0
        
        # Find most profitable event types
        most_profitable = sorted(
            event_roi_by_type.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]
        most_profitable_types = [event_type for event_type, _ in most_profitable if _ > 0]
        
        # Best conversion channels (simplified)
        best_conversion_channels = ["coffee_chat", "informational_interview", "networking_event"]
        
        return {
            "event_roi_by_type": event_roi_by_type,
            "most_profitable_event_types": most_profitable_types,
            "best_conversion_channels": best_conversion_channels
        }
        
        return {
            "event_roi_by_type": event_roi_by_type,
            "most_profitable_event_types": [t[0] for t in most_profitable if t[1] > 0],
            "best_conversion_channels": best_conversion_channels
        }
    
    def _generate_recommendations(
        self,
        relationship_data: Dict,
        engagement_data: Dict,
        opportunity_data: Dict,
        event_roi_data: Dict,
        benchmark: Dict
    ) -> List[str]:
        """Generate personalized recommendations based on analytics"""
        
        recommendations = []
        
        # Relationship recommendations
        if relationship_data["average_trust_score"] < benchmark["avg_relationship_strength_score"]:
            recommendations.append(
                "Focus on building deeper relationships - your trust score is below industry average. "
                "Consider more follow-up activities and providing value to your contacts."
            )
        
        if relationship_data["high_value_relationships"] < 5:
            recommendations.append(
                "Develop more high-value relationships (trust score 8+). "
                "Focus on quality over quantity in your networking efforts."
            )
        
        # Engagement recommendations
        if engagement_data["average_response_rate"] < benchmark["avg_response_rate"]:
            recommendations.append(
                "Improve your outreach strategy - your response rate is below average. "
                "Personalize your messages and research recipients better."
            )
        
        if engagement_data["follow_up_completion_rate"] < 0.7:
            recommendations.append(
                "Increase your follow-up completion rate. "
                "Set reminders and create a system for tracking follow-up actions."
            )
        
        # Opportunity recommendations
        if opportunity_data["referrals_generated"] == 0:
            recommendations.append(
                "Focus on generating referrals. Ask satisfied contacts for introductions "
                "and provide value before making requests."
            )
        
        # Event ROI recommendations
        profitable_types = event_roi_data["most_profitable_event_types"]
        if profitable_types:
            recommendations.append(
                f"Double down on {', '.join(profitable_types[:2])} - these show the best ROI for you."
            )
        
        # Activity level recommendations
        # This would require comparing with user's historical data
        
        return recommendations
    
    async def track_roi_outcome(
        self,
        user_uuid: str,
        roi_metric: ROIMetricType,
        value_description: str,
        source_event_id: Optional[str] = None,
        source_contact_id: Optional[str] = None,
        monetary_value: Optional[float] = None,
        confidence: float = 100.0
    ) -> str:
        """Track a specific ROI outcome from networking"""
        
        roi_data = {
            "uuid": user_uuid,
            "roi_metric": roi_metric.value,
            "achieved_date": datetime.now(timezone.utc).isoformat(),
            "source_event_id": source_event_id,
            "source_contact_id": source_contact_id,
            "value_description": value_description,
            "monetary_value": monetary_value,
            "confidence_in_attribution": confidence,
            "date_created": datetime.now(timezone.utc).isoformat(),
            "date_updated": datetime.now(timezone.utc).isoformat()
        }
        
        # This would be stored in a dedicated ROI tracking collection
        # For now, we'll add it to network analytics
        analytics_id = await network_analytics_dao.add_analytics_record(roi_data)
        
        return analytics_id

# Export singleton instance
networking_analytics_service = NetworkingAnalyticsService()
