from typing import NewType
from uuid import UUID


CorrelationId = NewType("CorrelationId", UUID)
RequestId = NewType("RequestId", UUID)
ActorId = NewType("ActorId", UUID)
IdempotencyKey = NewType("IdempotencyKey", str)