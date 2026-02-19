from unittest.mock import patch, MagicMock

from django.test import TestCase

from core.test_helpers import LogInHelper
from claimlens.models import (
    EngineConfig, EngineCapabilityScore, RoutingPolicy, DocumentType,
)
from claimlens.engine.manager import EngineManager
from claimlens.tests.data import ClaimlensTestDataMixin


class EngineCapabilityScoreModelTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api(username='routing_test')

    def _create_engine_config(self, name='Test Engine', is_primary=True):
        config = EngineConfig(
            name=name,
            adapter='mistral',
            endpoint_url='https://api.test.com',
            model_name='test-model',
            is_primary=is_primary,
            is_active=True,
        )
        config.save(user=self.user)
        return config

    def test_create_capability_score(self):
        config = self._create_engine_config()
        score = EngineCapabilityScore(
            engine_config=config,
            **self.capability_score_payload,
        )
        score.save(user=self.user)
        self.assertEqual(score.accuracy_score, 90)
        self.assertEqual(score.speed_score, 80)
        self.assertEqual(score.language, 'en')

    def test_unique_together_constraint(self):
        config = self._create_engine_config()
        EngineCapabilityScore(
            engine_config=config,
            language='en', accuracy_score=90, speed_score=80,
        ).save(user=self.user)

        with self.assertRaises(Exception):
            EngineCapabilityScore(
                engine_config=config,
                language='en', accuracy_score=85, speed_score=75,
            ).save(user=self.user)


class RoutingPolicySingletonTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api(username='routing_policy_test')

    def test_singleton_pattern(self):
        p1 = RoutingPolicy(accuracy_weight=0.5, cost_weight=0.3, speed_weight=0.2)
        p1.save(user=self.user)

        p2 = RoutingPolicy(accuracy_weight=0.7, cost_weight=0.2, speed_weight=0.1)
        p2.save(user=self.user)

        self.assertEqual(RoutingPolicy.objects.count(), 1)
        policy = RoutingPolicy.objects.first()
        self.assertAlmostEqual(policy.accuracy_weight, 0.7)


class EngineManagerSelectEngineTest(TestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = LogInHelper().get_or_create_user_api(username='engine_select_test')

    def _create_engine_config(self, name='Test Engine', adapter='mistral', is_primary=False):
        config = EngineConfig(
            name=name, adapter=adapter,
            endpoint_url='https://api.test.com',
            model_name='test-model',
            is_primary=is_primary, is_active=True,
        )
        config.save(user=self.user)
        return config

    def test_select_engine_no_language(self):
        manager = EngineManager()
        result = manager.select_engine(language=None)
        self.assertIsNone(result)

    def test_select_engine_no_scores(self):
        manager = EngineManager()
        result = manager.select_engine(language='en')
        self.assertIsNone(result)

    @patch('claimlens.engine.base.BaseLLMEngine.health_check', return_value=True)
    def test_select_engine_with_scores(self, mock_health):
        config1 = self._create_engine_config(name='Engine A', is_primary=True)
        config2 = self._create_engine_config(name='Engine B', adapter='openai_compatible')

        EngineCapabilityScore(
            engine_config=config1, language='en',
            accuracy_score=90, cost_per_page=0.05, speed_score=80,
        ).save(user=self.user)
        EngineCapabilityScore(
            engine_config=config2, language='en',
            accuracy_score=70, cost_per_page=0.02, speed_score=95,
        ).save(user=self.user)

        RoutingPolicy(accuracy_weight=0.5, cost_weight=0.3, speed_weight=0.2).save(user=self.user)

        manager = EngineManager()
        manager.load_engines()
        result = manager.select_engine(language='en')

        # Should return a tuple (config, engine)
        self.assertIsNotNone(result)

    def test_select_engine_falls_back_with_no_scores(self):
        """Without capability scores, select_engine returns None and callers fall back."""
        self._create_engine_config(name='Fallback Engine', is_primary=True)
        manager = EngineManager()
        result = manager.select_engine(language='sw')
        self.assertIsNone(result)
