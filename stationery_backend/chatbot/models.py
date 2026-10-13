from django.db import models

# Create your models here.
class chatbotfaq(models.Model):
    
    
    questions=models.CharField(max_length=300)
    keywords=models.TextField()
    answer=models.TextField()
    is_active=models.BooleanField(default=True)

    def __str__(self):
        return self.questions