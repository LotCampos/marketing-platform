from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/identity/", include("identity.urls")),
    path("api/master/", include("master.urls")),
    path("api/commercial/", include("commercial.urls")),
]