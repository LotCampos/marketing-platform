from abc import ABC, abstractmethod
from typing import Generic, Optional, TypeVar


Entity = TypeVar("Entity")
EntityId = TypeVar("EntityId")


class Repository(ABC, Generic[Entity, EntityId]):
    """
    Base repository contract for UI-CADO.

    Repositories isolate persistence concerns from the application
    and domain layers.
    """

    @abstractmethod
    def get_by_id(self, entity_id: EntityId) -> Optional[Entity]:
        """
        Retrieve an entity by its identifier.
        """
        raise NotImplementedError

    @abstractmethod
    def add(self, entity: Entity) -> Entity:
        """
        Register a new entity for persistence.
        """
        raise NotImplementedError

    @abstractmethod
    def update(self, entity: Entity) -> Entity:
        """
        Persist changes to an existing entity.
        """
        raise NotImplementedError

    @abstractmethod
    def delete(self, entity: Entity) -> None:
        """
        Remove an entity according to repository semantics.
        """
        raise NotImplementedError