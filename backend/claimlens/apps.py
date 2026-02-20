from django.apps import AppConfig

MODULE_NAME = "claimlens"

DEFAULT_CFG = {
    # Permissions
    "gql_query_documents_perms": ["159001"],
    "gql_query_extraction_results_perms": ["159002"],
    "gql_mutation_upload_document_perms": ["159003"],
    "gql_mutation_process_document_perms": ["159004"],
    "gql_query_document_types_perms": ["159005"],
    "gql_mutation_manage_document_types_perms": ["159006"],
    "gql_query_engine_configs_perms": ["159007"],
    "gql_mutation_manage_engine_configs_perms": ["159008"],
    "gql_query_validation_results_perms": ["159009"],
    "gql_mutation_run_validation_perms": ["159010"],
    "gql_query_validation_rules_perms": ["159011"],
    "gql_mutation_manage_validation_rules_perms": ["159012"],
    "gql_query_registry_proposals_perms": ["159013"],
    "gql_mutation_manage_registry_proposals_perms": ["159014"],
    "gql_query_capability_scores_perms": ["159015"],
    "gql_mutation_manage_capability_scores_perms": ["159016"],
    "gql_query_routing_policy_perms": ["159017"],
    "gql_mutation_manage_routing_policy_perms": ["159018"],
    "gql_mutation_manage_module_config_perms": ["159019"],
    "gql_mutation_manage_routing_rules_perms": ["159020"],
    "gql_query_routing_rules_perms": ["159021"],
    "gql_query_prompt_templates_perms": ["159022"],
    "gql_mutation_manage_prompt_templates_perms": ["159023"],
    "gql_mutation_review_extraction_perms": ["159024"],

    # Confidence thresholds
    "auto_approve_threshold": 0.90,
    "review_threshold": 0.60,

    # Storage (S3/MinIO)
    "storage_bucket_name": "claimlens",
    "storage_endpoint_url": "http://minio:9000",
    "storage_access_key": "minioadmin",
    "storage_secret_key": "minioadmin",

    # Celery
    "celery_broker_url": "redis://redis-claimlens:6379/0",
    "celery_queue_preprocessing": "claimlens.preprocessing",
    "celery_queue_classification": "claimlens.classification",
    "celery_queue_extraction": "claimlens.extraction",
    "celery_queue_validation": "claimlens.validation",

    # LLM
    "default_engine_adapter": "openai_compatible",
    "llm_request_timeout_seconds": 120,
    "llm_max_retries": 2,

    # Limits
    "max_file_size_mb": 20,
    "allowed_mime_types": [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/webp",
    ],
}


class ClaimlensConfig(AppConfig):
    name = MODULE_NAME

    # Permissions
    gql_query_documents_perms = []
    gql_query_extraction_results_perms = []
    gql_mutation_upload_document_perms = []
    gql_mutation_process_document_perms = []
    gql_query_document_types_perms = []
    gql_mutation_manage_document_types_perms = []
    gql_query_engine_configs_perms = []
    gql_mutation_manage_engine_configs_perms = []
    gql_query_validation_results_perms = []
    gql_mutation_run_validation_perms = []
    gql_query_validation_rules_perms = []
    gql_mutation_manage_validation_rules_perms = []
    gql_query_registry_proposals_perms = []
    gql_mutation_manage_registry_proposals_perms = []
    gql_query_capability_scores_perms = []
    gql_mutation_manage_capability_scores_perms = []
    gql_query_routing_policy_perms = []
    gql_mutation_manage_routing_policy_perms = []
    gql_mutation_manage_module_config_perms = []
    gql_mutation_manage_routing_rules_perms = []
    gql_query_routing_rules_perms = []
    gql_query_prompt_templates_perms = []
    gql_mutation_manage_prompt_templates_perms = []
    gql_mutation_review_extraction_perms = []

    # Confidence thresholds
    auto_approve_threshold = None
    review_threshold = None

    # Storage
    storage_bucket_name = None
    storage_endpoint_url = None
    storage_access_key = None
    storage_secret_key = None

    # Celery
    celery_broker_url = None
    celery_queue_preprocessing = None
    celery_queue_classification = None
    celery_queue_extraction = None
    celery_queue_validation = None

    # LLM
    default_engine_adapter = None
    llm_request_timeout_seconds = None
    llm_max_retries = None

    # Limits
    max_file_size_mb = None
    allowed_mime_types = None

    def __load_config(self, cfg):
        for field in cfg:
            if hasattr(ClaimlensConfig, field):
                setattr(ClaimlensConfig, field, cfg[field])

    def ready(self):
        from core.models import ModuleConfiguration

        cfg = ModuleConfiguration.get_or_default(MODULE_NAME, DEFAULT_CFG)
        self.__load_config(cfg)

        import claimlens.signals  # noqa: F401
