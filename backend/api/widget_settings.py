from fastapi import APIRouter, Depends

from core.jwt import get_current_user
from schemas.widget_settings import WidgetSettingsResponse, WidgetSettingsUpdate
from services.widget_settings import get_widget_settings, update_widget_settings

router = APIRouter()


@router.get("/settings", response_model=WidgetSettingsResponse)
async def read_widget_settings(current_user: dict = Depends(get_current_user)):
    return await get_widget_settings(current_user["sub"])


@router.put("/settings", response_model=WidgetSettingsResponse)
async def put_widget_settings(
    body: WidgetSettingsUpdate,
    current_user: dict = Depends(get_current_user),
):
    return await update_widget_settings(current_user["sub"], body)
