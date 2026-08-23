
# API Documentation



Welcome to the GRM API documentation.



## Quick Start 


- [API Overview](./api.md) - Complete API reference

- [Authentication](./auth.md) - How to authenticate requests

- [Error Handling](./errors.md) - Error codes and responses



## Models



This system uses a TypeScript-based model structure with WatermelonDB for offline-first capabilities.



### Core Concepts



- **Base Model**: All models extend from `Base` which provides common fields like `id`, `created_date`, `updated_date`, etc.

- **Relations**: Models can have relationships to other models (e.g., Issue has many Comments)

- **Sync**: Models support offline synchronization with the server



### Available Models



| Model | Description |

|-------|-------------|

| `Issue` | Main issue report entity |

| `IssueAttachment` | File attachments for issues |

| `IssueCategory` | Category classifications |

| `IssueType` | Issue type classifications |

| `IssueSubType` | Issue subtype classifications |

| `IssueSubComponent` | Issue subcomponent classifications |

| `IssueComponent` | Issue component classifications |

| `AdministrativeRegion` | Administrative regions for issue location |

| `IssueStatus` | Status tracking (open, closed, rejected, etc.) |

| `IssueAgeGroup` | Age group demographics |

| `IssueCitizenGroup` | Citizen group classifications |

| `IssueComment` | Comments on issues |



## Getting Started


[Reference](../README.md)

