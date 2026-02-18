import uuid

from graphene import Schema
from graphene.test import Client

from core.test_helpers import LogInHelper, create_test_role
from core.models.openimis_graphql_test_case import openIMISGraphQLTestCase, BaseTestContext
from claimlens.models import Document, DocumentType
from claimlens.schema import Query, Mutation
from claimlens.tests.data import ClaimlensTestDataMixin


GQL_QUERY_DOCUMENTS = """
{
    claimlensDocuments {
        edges {
            node {
                uuid
                originalFilename
                status
            }
        }
    }
}
"""

GQL_QUERY_DOCUMENT_TYPES = """
{
    claimlensDocumentTypes {
        edges {
            node {
                uuid
                code
                name
                isActive
            }
        }
    }
}
"""

GQL_MUTATION_PROCESS_DOCUMENT = """
mutation ($uuid: String!, $clientMutationId: String!) {
    processClaimlensDocument(input: {
        uuid: $uuid
        clientMutationId: $clientMutationId
        clientMutationLabel: "Process Document"
    }) {
        clientMutationId
        internalId
    }
}
"""

GQL_MUTATION_CREATE_DOCUMENT_TYPE = """
mutation ($code: String!, $name: String!, $clientMutationId: String!) {
    createClaimlensDocumentType(input: {
        code: $code
        name: $name
        clientMutationId: $clientMutationId
        clientMutationLabel: "Create Document Type"
    }) {
        clientMutationId
        internalId
    }
}
"""


class ClaimlensGraphQLTest(openIMISGraphQLTestCase, ClaimlensTestDataMixin):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        authorized_perms = [
            "gql_query_documents_perms",
            "gql_query_extraction_results_perms",
            "gql_mutation_process_document_perms",
            "gql_query_document_types_perms",
        ]
        cls.authorized_role = create_test_role(
            perm_names=authorized_perms, name="ClaimlensAuthorizedRole"
        )
        cls.unauthorized_role = create_test_role(
            perm_names=[], name="ClaimlensUnauthorizedRole"
        )

        cls.user = LogInHelper().get_or_create_user_api(
            username='claimlens_auth', roles=[cls.authorized_role.id]
        )
        cls.user_unauthorized = LogInHelper().get_or_create_user_api(
            username='claimlens_unauth', roles=[cls.unauthorized_role.id]
        )

        gql_schema = Schema(query=Query, mutation=Mutation)
        cls.gql_client = Client(gql_schema)
        cls.gql_context = BaseTestContext(cls.user)
        cls.gql_context_unauthorized = BaseTestContext(cls.user_unauthorized)

    def _create_document_type(self):
        dt = DocumentType(**self.document_type_payload)
        dt.save(user=self.user)
        return dt

    def _create_document(self, doc_type=None):
        payload = {**self.document_payload}
        if doc_type:
            payload['document_type'] = doc_type
        doc = Document(**payload)
        doc.save(user=self.user)
        return doc

    def test_query_documents_authorized(self):
        self._create_document()
        output = self.gql_client.execute(
            GQL_QUERY_DOCUMENTS, context=self.gql_context.get_request()
        )
        self.assertIsNone(output.get('errors'))

    def test_query_documents_unauthorized(self):
        output = self.gql_client.execute(
            GQL_QUERY_DOCUMENTS, context=self.gql_context_unauthorized.get_request()
        )
        errors = output.get('errors', [])
        self.assertTrue(len(errors) > 0)

    def test_query_document_types_authorized(self):
        self._create_document_type()
        output = self.gql_client.execute(
            GQL_QUERY_DOCUMENT_TYPES, context=self.gql_context.get_request()
        )
        self.assertIsNone(output.get('errors'))

    def test_query_document_types_unauthorized(self):
        output = self.gql_client.execute(
            GQL_QUERY_DOCUMENT_TYPES, context=self.gql_context_unauthorized.get_request()
        )
        errors = output.get('errors', [])
        self.assertTrue(len(errors) > 0)

    def test_process_document_mutation_authorized(self):
        doc = self._create_document()
        variables = {
            "uuid": str(doc.id),
            "clientMutationId": str(uuid.uuid4()),
        }
        output = self.gql_client.execute(
            GQL_MUTATION_PROCESS_DOCUMENT,
            context=self.gql_context.get_request(),
            variable_values=variables,
        )
        self.assertIsNone(output.get('errors'))

    def test_create_document_type_mutation_unauthorized(self):
        variables = {
            "code": "UNAUTH_TEST",
            "name": "Unauthorized Test Type",
            "clientMutationId": str(uuid.uuid4()),
        }
        self.gql_client.execute(
            GQL_MUTATION_CREATE_DOCUMENT_TYPE,
            context=self.gql_context_unauthorized.get_request(),
            variable_values=variables,
        )
        self.assertFalse(
            DocumentType.objects.filter(code="UNAUTH_TEST", is_deleted=False).exists()
        )
