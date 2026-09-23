from typing import Literal, Optional

from pydantic import BaseModel, Field

Theme = Literal["dark", "light"]
Position = Literal["top-left", "top-right", "bottom-left", "bottom-right"]


class WidgetSettingsResponse(BaseModel):
    widget_enabled: bool
    auto_start: bool
    theme: Theme
    position: Position
    auto_sync: bool
    keyboard_shortcut: str
    notifications_enabled: bool


class WidgetSettingsUpdate(BaseModel):
    widget_enabled: Optional[bool] = None
    auto_start: Optional[bool] = None
    theme: Optional[Theme] = None
    position: Optional[Position] = None
    auto_sync: Optional[bool] = None
    keyboard_shortcut: Optional[str] = Field(default=None, min_length=1, max_length=80)
    notifications_enabled: Optional[bool] = None
