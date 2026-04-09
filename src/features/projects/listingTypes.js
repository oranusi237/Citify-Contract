export const listingTypeOptions = [
  { value: 'land', label: 'Land' },
  { value: 'property', label: 'Property' },
  { value: 'shop', label: 'Shopping Complex' },
]

const listingTypeConfig = {
  land: {
    label: 'Land',
    singular: 'Land',
    badge: 'Land Listing',
    sectionTitle: 'About This Land',
    featuresTitle: 'Land Highlights',
    specificationLabels: {
      area: 'Plot Size',
      units: 'Title Status',
      floors: 'Payment Plan',
      parking: 'Road Access',
    },
    specificationPlaceholders: {
      area: 'e.g. 500-650 sqm',
      units: 'e.g. C of O / Registered Survey',
      floors: 'Available / Unavailable',
      parking: 'e.g. Tarred access road',
    },
  },
  property: {
    label: 'Property',
    singular: 'Property',
    badge: 'Property Listing',
    sectionTitle: 'About This Property',
    featuresTitle: 'Property Features',
    specificationLabels: {
      area: 'Property Size',
      units: 'Bedrooms',
      floors: 'Bathrooms',
      parking: 'Parking',
    },
    specificationPlaceholders: {
      area: 'e.g. 320 sqm built-up area',
      units: 'e.g. 4 bedrooms',
      floors: 'e.g. 5 bathrooms',
      parking: 'e.g. 3-car parking',
    },
  },
  shop: {
    label: 'Shopping Complex',
    singular: 'Shopping Complex',
    badge: 'Commercial Complex',
    sectionTitle: 'About This Shopping Complex',
    featuresTitle: 'Complex Features',
    specificationLabels: {
      area: 'Floor Area',
      units: 'Complex Type',
      floors: 'Payment Plan',
      parking: 'Parking Capacity',
    },
    specificationPlaceholders: {
      area: 'e.g. 3,500 sqm gross lettable area',
      units: 'e.g. Neighborhood retail complex',
      floors: 'Available / Unavailable',
      parking: 'e.g. 120 parking bays',
    },
  },
}

export const normalizeListingType = (value) => (listingTypeConfig[value] ? value : 'land')

export const getListingTypeConfig = (value) => listingTypeConfig[normalizeListingType(value)]