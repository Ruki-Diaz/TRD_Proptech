from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from enum import Enum
from uuid import UUID

class PurposeEnum(str, Enum):
    sale = 'sale'
    rent = 'rent'

class PropertyTypeEnum(str, Enum):
    land = 'land'
    house = 'house'
    apartment = 'apartment'
    commercial = 'commercial'
    annex = 'annex'

class SizeUnitEnum(str, Enum):
    perches = 'perches'
    acres = 'acres'
    sqft = 'sqft'

class ListingStatusEnum(str, Enum):
    available = 'available'
    sold = 'sold'
    rented = 'rented'

class ListedByEnum(str, Enum):
    owner = 'owner'
    agent = 'agent'

class PropertyCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    purpose: PurposeEnum
    property_type: PropertyTypeEnum
    price: float = Field(..., gt=0)
    district: str = Field(..., min_length=2)
    city: str = Field(..., min_length=2)
    address: Optional[str] = None
    land_size: Optional[float] = None
    land_size_unit: Optional[SizeUnitEnum] = SizeUnitEnum.perches
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    features: List[str] = []
    main_image_url: Optional[str] = None
    image_urls: List[str] = []
    agent_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    phone_number: Optional[str] = None
    user_id: Optional[UUID] = None
    status: ListingStatusEnum = ListingStatusEnum.available
    listed_by: ListedByEnum = ListedByEnum.agent
    is_verified: bool = False
    featured: bool = False
    is_published: bool = True

class PropertyUpdate(PropertyCreate):
    title: Optional[str] = None
    description: Optional[str] = None
    purpose: Optional[PurposeEnum] = None
    property_type: Optional[PropertyTypeEnum] = None
    price: Optional[float] = None
    district: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    land_size: Optional[float] = None
    land_size_unit: Optional[SizeUnitEnum] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    features: Optional[List[str]] = None
    main_image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    agent_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    phone_number: Optional[str] = None
    user_id: Optional[UUID] = None
    status: Optional[ListingStatusEnum] = None
    listed_by: Optional[ListedByEnum] = None
    is_verified: Optional[bool] = None
    featured: Optional[bool] = None
    is_published: Optional[bool] = None
