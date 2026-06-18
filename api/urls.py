from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AutoPartViewSet

# Роутер автоматично створює всі шляхи для CRUD (створення, читання, оновлення, видалення)
router = DefaultRouter()
router.register(r'parts', AutoPartViewSet)

urlpatterns = [
    path('', include(router.urls)),
]