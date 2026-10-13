from django.contrib import admin
from . models import chatbotfaq
# Register your models here.
@admin.register(chatbotfaq)


class Chatbotfaqadmin(admin.ModelAdmin):
    list_display=('questions','is_active')
    search_fields=('questions','keywords','answer')