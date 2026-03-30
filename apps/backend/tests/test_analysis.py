from supportiq_common.analysis import TicketAnalyzer


def test_rule_based_analysis_detects_delivery_issue():
    analyzer = TicketAnalyzer()

    result = analyzer._analyze_with_rules(
        "Cargo delay",
        "My shipment is delayed for 5 days and I want a refund immediately.",
    )

    assert result.category == "delivery_issue"
    assert result.priority == "high"
    assert result.sentiment == "negative"
    assert result.assigned_team == "customer_operations"
